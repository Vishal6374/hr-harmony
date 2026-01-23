import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import AttendanceLog from '../models/AttendanceLog';
import { AppError } from '../middleware/errorHandler';
import { calculateWorkHours, isWeekend } from '../utils/helpers';

export const getAttendanceLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    const { employee_id, start_date, end_date, status } = req.query;

    const where: any = {};

    // If not HR, only show own attendance
    if (req.user?.role !== 'hr') {
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

    const logs = await AttendanceLog.findAll({
        where,
        include: [
            {
                association: 'employee',
                attributes: ['id', 'name', 'email', 'employee_id', 'status'],
                where: { status: { [Op.ne]: 'terminated' } }, // Exclude terminated employees
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

        // Only HR can mark attendance for others
        const targetEmployeeId = req.user?.role === 'hr' ? employee_id : req.user?.id;

        if (!targetEmployeeId) {
            throw new AppError(400, 'Employee ID is required');
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

        // Get attendance settings
        const AttendanceSettings = (await import('../models/AttendanceSettings')).default;
        let settings = await AttendanceSettings.findOne();
        if (!settings) {
            settings = await AttendanceSettings.create({
                standard_work_hours: 8.00,
                half_day_threshold: 4.00,
            });
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
        // Only HR can update attendance
        if (req.user?.role !== 'hr') {
            throw new AppError(403, 'Only HR can update attendance records');
        }

        const { id } = req.params;
        const { employee_id, date, check_in, check_out, status, notes, edit_reason } = req.body;

        // Find existing attendance record
        const attendance = await AttendanceLog.findByPk(String(id));

        if (!attendance) {
            throw new AppError(404, 'Attendance record not found');
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

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can lock attendance');
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

    const targetEmployeeId = req.user?.role === 'hr' ? (employee_id as string) : req.user?.id;

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

    const summary = {
        total_days: logs.length,
        present: logs.filter(l => l.status === 'present').length,
        absent: logs.filter(l => l.status === 'absent').length,
        half_day: logs.filter(l => l.status === 'half_day').length,
        on_leave: logs.filter(l => l.status === 'on_leave').length,
        weekend: logs.filter(l => l.status === 'weekend').length,
        holiday: logs.filter(l => l.status === 'holiday').length,
        total_work_hours: logs.reduce((sum, l) => sum + (l.work_hours || 0), 0),
    };

    res.json(summary);
};
