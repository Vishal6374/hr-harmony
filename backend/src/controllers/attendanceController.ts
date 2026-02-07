import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import User from '../models/User';
import AttendanceLog from '../models/AttendanceLog';
import { AppError } from '../middleware/errorHandler';
import Holiday from '../models/Holiday';
import { calculateWorkHours, isWeekend, getDaysInMonth } from '../utils/helpers';
import { logAudit } from '../utils/auditLogger';


export const getAttendanceLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    const { employee_id, start_date, end_date, status } = req.query;

    const where: any = {};

    // If not HR/Admin, only show own attendance
    if (req.user?.role !== 'hr' && req.user?.role !== 'admin') {
        where.employee_id = req.user?.id;
    } else if (employee_id) {
        where.employee_id = employee_id;
    }

    if (start_date && end_date) {
        const isValidDate = (d: any) => !isNaN(new Date(d).getTime());
        if (isValidDate(start_date) && isValidDate(end_date)) {
            where.date = {
                [Op.between]: [new Date(start_date as string), new Date(end_date as string)],
            };
        }
    }

    if (status) {
        where.status = status;
    }

    // Auto-mark half days for missing clock-outs
    const AttendanceSettings = (await import('../models/AttendanceSettings')).default;
    const settings = await AttendanceSettings.findOne();
    if (settings && settings.auto_half_day_time) {
        const [hour, minute] = settings.auto_half_day_time.split(':').map(Number);
        const now = new Date();

        // Find logs that need auto-correction
        const pendingLogs = await AttendanceLog.findAll({
            where: {
                ...where,
                check_in: { [Op.ne]: null },
                check_out: null,
                status: 'present', // Only auto-correct if they were initially marked present/ongoing
                date: { [Op.lt]: now.toISOString().split('T')[0] } // Only for past days to avoid marking today prematurely
            }
        });

        for (const log of pendingLogs) {
            log.status = 'half_day';
            log.notes = (log.notes ? log.notes + ' ' : '') + '(Auto-marked half day due to missing clock-out)';
            await log.save();
        }

        // Also check if TODAY is already past the auto_half_day_time
        const todayStr = now.toISOString().split('T')[0];
        const thresholdToday = new Date(now);
        thresholdToday.setHours(hour, minute, 0, 0);

        if (now > thresholdToday) {
            const todayPendingLogs = await AttendanceLog.findAll({
                where: {
                    ...where,
                    date: todayStr,
                    check_in: { [Op.ne]: null },
                    check_out: null,
                    status: 'present'
                }
            });

            for (const log of todayPendingLogs) {
                log.status = 'half_day';
                log.notes = (log.notes ? log.notes + ' ' : '') + '(Auto-marked half day due to missing clock-out)';
                await log.save();
            }
        }
    }

    const logs = await AttendanceLog.findAll({
        where,
        include: [
            {
                association: 'employee',
                attributes: ['id', 'name', 'email', 'employee_id', 'status', 'pf_percentage', 'esi_percentage', 'absent_deduction_type', 'absent_deduction_value'],
                where: {
                    status: { [Op.ne]: 'terminated' }, // Exclude terminated employees
                    ...(req.user?.role === 'hr' ? { role: { [Op.ne]: 'admin' } } : {})
                },
                required: true // Inner join to exclude logs of terminated employees
            },
        ],
        order: [['date', 'DESC']],
    });

    res.json(logs);
};

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { employee_id, date, check_in, check_out, status, notes } = req.body;

        const isHRorAdmin = req.user?.role === 'hr' || req.user?.role === 'admin';
        // Only HR can mark attendance for others
        const targetEmployeeId = isHRorAdmin ? employee_id : req.user?.id;

        if (!targetEmployeeId) {
            throw new AppError(400, 'Employee ID is required');
        }

        // Restriction: HR cannot mark their own attendance
        if (req.user?.role === 'hr' && targetEmployeeId === req.user?.id) {
            throw new AppError(403, 'HR cannot mark their own attendance. This must be done by an Admin.');
        }

        // Get attendance settings
        const AttendanceSettings = (await import('../models/AttendanceSettings')).default;
        let settings = await AttendanceSettings.findOne();
        if (!settings) {
            settings = await AttendanceSettings.create({
                standard_work_hours: 8.00,
                half_day_threshold: 4.00,
                allow_self_clock_in: true,
            });
        }

        // Check if employee is allowed to clock in themselves
        if (!isHRorAdmin && !settings.allow_self_clock_in) {
            throw new AppError(403, 'Self clock-in is currently disabled by the administrator');
        }

        // Ensure date is treated as YYYY-MM-DD
        const d = new Date(date);
        const attendanceDate = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // Check if attendance is locked
        const existingLog = await AttendanceLog.findOne({
            where: {
                employee_id: targetEmployeeId,
                date: attendanceDate,
            },
        });

        if (existingLog?.is_locked) {
            throw new AppError(400, 'Attendance is locked for this date');
        }

        // Calculate work hours
        // Use provided check_in OR existing check_in
        const actualCheckIn = check_in ? new Date(check_in) : existingLog?.check_in;
        // Use provided check_out OR existing check_out
        const actualCheckOut = check_out ? new Date(check_out) : existingLog?.check_out;

        let workHours: number | undefined;
        if (actualCheckIn && actualCheckOut) {
            workHours = calculateWorkHours(actualCheckIn, actualCheckOut);
        }

        // Determine status based on settings
        let attendanceStatus = status;

        // Auto-calculate status if we have enough info and status isn't forced by HR
        if (!attendanceStatus && actualCheckIn && actualCheckOut && workHours !== undefined) {
            // Use settings to determine status
            if (workHours < settings.half_day_threshold) {
                attendanceStatus = 'absent';
            } else if (workHours >= settings.half_day_threshold && workHours < settings.standard_work_hours) {
                attendanceStatus = 'half_day';
            } else {
                attendanceStatus = 'present';
            }
        } else if (!attendanceStatus) {
            if (isWeekend(new Date(attendanceDate))) {
                attendanceStatus = 'weekend';
            } else if (check_in && !check_out) {
                // If only clocking in, assume present until clock out (or set initial status)
                attendanceStatus = 'present';
            } else {
                attendanceStatus = 'absent';
            }
        }

        const [attendance] = await AttendanceLog.upsert({
            employee_id: targetEmployeeId,
            date: attendanceDate as unknown as Date,
            check_in: check_in ? new Date(check_in) : undefined,
            check_out: check_out ? new Date(check_out) : undefined,
            status: attendanceStatus,
            work_hours: workHours,
            notes,
            is_locked: false,
        });

        if (isHRorAdmin) {
            const targetUser = await User.findByPk(targetEmployeeId, { attributes: ['name'] });
            await logAudit({
                action: `Marked attendance for ${targetUser?.name || 'Employee'} as ${attendanceStatus} on ${attendanceDate}`,
                module: 'ATTENDANCE',
                entity_type: 'ATTENDANCE_LOG',
                entity_id: attendance.id,
                performed_by: req.user!.id,
                new_value: attendance.toJSON(),
                ip_address: req.ip,
                user_agent: req.get('user-agent'),
            });
        }

        res.json({
            message: 'Attendance marked successfully',
            attendance,
        });

    } catch (error: any) {
        console.error('Error in markAttendance:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            // Send the actual error message for debugging
            res.status(500).json({
                message: 'Internal server error marking attendance',
                error: error.message || String(error)
            });
        }
    }
};

export const updateAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Only HR or Admin can update attendance
        if (req.user?.role !== 'hr' && req.user?.role !== 'admin') {
            throw new AppError(403, 'Only HR or Admin can update attendance records');
        }

        const { id } = req.params;
        const { employee_id, date, check_in, check_out, status, notes, edit_reason } = req.body;

        // Find existing attendance record
        const attendance = await AttendanceLog.findByPk(String(id));

        if (!attendance) {
            throw new AppError(404, 'Attendance record not found');
        }

        // Restriction: HR cannot update their own attendance
        if (req.user?.role === 'hr' && attendance.employee_id === req.user?.id) {
            throw new AppError(403, 'HR cannot update their own attendance. This must be done by an Admin.');
        }

        // Check if attendance is locked
        if (attendance.is_locked) {
            throw new AppError(400, 'Attendance is locked and cannot be edited');
        }

        // Get attendance settings
        const AttendanceSettings = (await import('../models/AttendanceSettings')).default;
        let settings = await AttendanceSettings.findOne();
        if (!settings) {
            settings = await AttendanceSettings.create({
                standard_work_hours: 8.00,
                half_day_threshold: 4.00,
            });
        }

        // Calculate work hours if both check_in and check_out are provided
        let workHours: number | undefined;
        const newCheckIn = check_in ? new Date(check_in) : attendance.check_in;
        const newCheckOut = check_out ? new Date(check_out) : attendance.check_out;

        if (newCheckIn && newCheckOut) {
            workHours = calculateWorkHours(newCheckIn, newCheckOut);
        }

        // Determine status based on settings
        // If status is explicitly provided, use it (manual override)
        // Otherwise, always recalculate based on work hours
        let attendanceStatus = status;

        if (!status && newCheckIn && newCheckOut && workHours !== undefined) {
            // Auto-calculate status based on work hours
            if (workHours < settings.half_day_threshold) {
                attendanceStatus = 'absent';
            } else if (workHours >= settings.half_day_threshold && workHours < settings.standard_work_hours) {
                attendanceStatus = 'half_day';
            } else {
                attendanceStatus = 'present';
            }
        } else if (!status) {
            // If no times provided and no status override, keep existing status
            attendanceStatus = attendance.status;
        }

        const oldValues = attendance.toJSON();
        // Update attendance record
        await attendance.update({
            employee_id: employee_id || attendance.employee_id,
            date: date ? (new Date(date).toISOString().split('T')[0] as unknown as Date) : attendance.date,
            check_in: check_in ? new Date(check_in) : attendance.check_in,
            check_out: check_out ? new Date(check_out) : attendance.check_out,
            status: attendanceStatus,
            work_hours: workHours !== undefined ? workHours : attendance.work_hours,
            notes: notes !== undefined ? notes : attendance.notes,
            edited_by: req.user?.id,
            edit_reason: edit_reason || 'Manual edit by HR',
        });

        const targetUser = await User.findByPk(attendance.employee_id, { attributes: ['name'] });
        await logAudit({
            action: `Updated attendance for ${targetUser?.name || 'Employee'} on ${attendance.date}`,
            module: 'ATTENDANCE',
            entity_type: 'ATTENDANCE_LOG',
            entity_id: attendance.id,
            performed_by: req.user!.id,
            old_value: oldValues,
            new_value: attendance.toJSON(),
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
        });

        res.json({
            message: 'Attendance updated successfully',
            attendance,
        });
    } catch (error: any) {
        console.error('Error in updateAttendance:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({
                message: 'Internal server error updating attendance',
                error: error.message || String(error)
            });
        }
    }
};

export const lockAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year } = req.body;

    if (req.user?.role !== 'hr' && req.user?.role !== 'admin') {
        throw new AppError(403, 'Only HR or Admin can lock attendance');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    await AttendanceLog.update(
        { is_locked: true },
        {
            where: {
                date: {
                    [Op.between]: [startDate, endDate],
                },
            },
        }
    );

    res.json({ message: `Attendance locked for ${month}/${year}` });
};

export const getAttendanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    const { employee_id, month, year } = req.query;

    const isHRorAdmin = req.user?.role === 'hr' || req.user?.role === 'admin';
    const targetEmployeeId = isHRorAdmin ? (employee_id as string) : req.user?.id;

    if (!targetEmployeeId) {
        throw new AppError(400, 'Employee ID is required');
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const logs = await AttendanceLog.findAll({
        where: {
            employee_id: targetEmployeeId,
            date: {
                [Op.between]: [startDate, endDate],
            },
        },
    });

    const holidays = await Holiday.findAll({
        where: {
            date: {
                [Op.between]: [startDate, endDate],
            },
        },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let present = 0;
    let absent = 0;
    let half_day = 0;
    let on_leave = 0;
    let weekend = 0;
    let holiday = 0;
    let total_work_hours = 0;

    const daysCount = getDaysInMonth(Number(year), Number(month));
    const logsMap = new Map();
    logs.forEach(l => {
        const d = new Date(l.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        logsMap.set(key, l);
    });

    const holidaysSet = new Set();
    holidays.forEach(h => {
        const d = new Date(h.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        holidaysSet.add(key);
    });

    for (let d = 1; d <= daysCount; d++) {
        const currentBatchDate = new Date(Number(year), Number(month) - 1, d);
        if (currentBatchDate > today) break;

        const key = `${currentBatchDate.getFullYear()}-${currentBatchDate.getMonth() + 1}-${currentBatchDate.getDate()}`;
        const log = logsMap.get(key);
        const isHday = holidaysSet.has(key);
        const isWday = isWeekend(currentBatchDate);

        if (log) {
            if (log.status === 'present') present++;
            else if (log.status === 'absent') absent++;
            else if (log.status === 'half_day') half_day++;
            else if (log.status === 'on_leave') on_leave++;
            else if (log.status === 'weekend') weekend++;
            else if (log.status === 'holiday') holiday++;
            total_work_hours += Number(log?.work_hours || 0);
        } else if (currentBatchDate < today) {
            if (isHday) holiday++;
            else if (isWday) weekend++;
            else absent++;
        }
    }

    const summary = {
        total_days: present + absent + half_day + on_leave + weekend + holiday,
        present,
        absent,
        half_day,
        on_leave,
        weekend,
        holiday,
        total_work_hours,
    };

    res.json(summary);
};

