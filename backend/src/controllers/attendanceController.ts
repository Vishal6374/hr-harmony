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
            { association: 'employee', attributes: ['id', 'name', 'email', 'employee_id'] },
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

        // Calculate work hours if both check_in and check_out are provided
        let workHours: number | undefined;
        if (check_in && check_out) {
            workHours = calculateWorkHours(new Date(check_in), new Date(check_out));
        }

        // Determine status if not provided
        let attendanceStatus = status;
        if (!attendanceStatus) {
            if (isWeekend(new Date(attendanceDate))) {
                attendanceStatus = 'weekend';
            } else if (check_in && check_out) {
                attendanceStatus = (workHours || 0) >= 8 ? 'present' : 'half_day';
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
