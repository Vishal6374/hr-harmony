import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import LeaveRequest from '../models/LeaveRequest';
import LeaveBalance from '../models/LeaveBalance';
import AttendanceLog from '../models/AttendanceLog';
import { AppError } from '../middleware/errorHandler';
import { calculateWorkingDays } from '../utils/helpers';

export const getLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, employee_id } = req.query;

        const where: any = {};

        // If not HR, only show own leaves
        if (req.user?.role !== 'hr') {
            where.employee_id = req.user?.id;
        } else if (employee_id) {
            where.employee_id = employee_id;
        }

        if (status && status !== 'all') {
            where.status = status;
        }

        const leaves = await LeaveRequest.findAll({
            where,
            include: [
                { association: 'employee', attributes: ['id', 'name', 'email', 'employee_id'] },
                { association: 'approver', attributes: ['id', 'name', 'email'] },
            ],
            order: [['created_at', 'DESC']],
        });

        res.json(leaves);
    } catch (error) {
        console.error('Error in getLeaveRequests:', error);
        res.status(500).json({ message: 'Internal server error fetching leave requests' });
    }
};

export const getLeaveBalances = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { employee_id, year } = req.query;

        const targetEmployeeId = req.user?.role === 'hr' && employee_id ? String(employee_id) : req.user?.id;
        const targetYear = year ? Number(year) : new Date().getFullYear();

        if (!targetEmployeeId) throw new AppError(400, 'Employee ID required');

        // 1. Get Global Limits
        const LeaveLimit = (await import('../models/LeaveLimit')).default;
        let limits = await LeaveLimit.findOne();
        if (!limits) {
            limits = await LeaveLimit.create({ casual_leave: 12, sick_leave: 12, earned_leave: 15 });
        }

        // 2. Get Existing Key Balances
        const existingBalances = await LeaveBalance.findAll({
            where: {
                employee_id: targetEmployeeId,
                year: targetYear
            }
        });

        const leaveTypes = [
            { type: 'casual', limit: limits.casual_leave },
            { type: 'sick', limit: limits.sick_leave },
            { type: 'earned', limit: limits.earned_leave }
        ] as const;

        // 3. Sync Balances
        for (const { type, limit } of leaveTypes) {
            let balance = existingBalances.find(b => b.leave_type === type);

            if (balance) {
                // Update total limit if changed by HR
                if (balance.total !== limit) {
                    balance.total = limit;
                    balance.remaining = Math.max(0, limit - balance.used);
                    await balance.save();
                }
            } else {
                // Initialize if missing
                await LeaveBalance.create({
                    employee_id: targetEmployeeId,
                    leave_type: type,
                    year: targetYear,
                    total: limit,
                    used: 0,
                    remaining: limit,
                });
            }
        }

        // 4. Return fresh list
        const balances = await LeaveBalance.findAll({
            where: {
                employee_id: targetEmployeeId,
                year: targetYear
            },
            include: [
                { association: 'employee', attributes: ['id', 'name', 'email', 'employee_id'] },
            ],
        });

        res.json(balances);
    } catch (error) {
        console.error('Error in getLeaveBalances:', error);
        res.status(500).json({ message: 'Internal server error fetching leave balances' });
    }
};

export const applyLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { leave_type, start_date, end_date, reason } = req.body;

        const employeeId = req.user?.id;
        if (!employeeId) throw new AppError(401, 'User not authenticated');

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        // Calculate working days
        const days = calculateWorkingDays(startDate, endDate);

        // Check leave balance
        let balance = await LeaveBalance.findOne({
            where: {
                employee_id: employeeId,
                leave_type: leave_type,
                year: startDate.getFullYear(),
            },
        });

        // Auto-initialize balance if not found (using Limits)
        if (!balance) {
            const LeaveLimit = (await import('../models/LeaveLimit')).default;
            let limits = await LeaveLimit.findOne();
            if (!limits) {
                limits = await LeaveLimit.create({ casual_leave: 12, sick_leave: 12, earned_leave: 15 });
            }

            let limit = 0;
            if (leave_type === 'casual') limit = limits.casual_leave;
            else if (leave_type === 'sick') limit = limits.sick_leave;
            else if (leave_type === 'privilege' || leave_type === 'earned') limit = limits.earned_leave;
            else limit = 15; // default fallback

            balance = await LeaveBalance.create({
                employee_id: employeeId,
                leave_type,
                year: startDate.getFullYear(),
                total: limit,
                used: 0,
                remaining: limit,
            });
        }

        if (balance.remaining < days) {
            throw new AppError(400, `Insufficient leave balance. Available: ${balance.remaining} days`);
        }

        // Create leave request
        const leaveRequest = await LeaveRequest.create({
            employee_id: employeeId,
            leave_type,
            start_date: startDate,
            end_date: endDate,
            days,
            reason,
            status: 'pending',
        });

        res.status(201).json({
            message: 'Leave request submitted successfully',
            leaveRequest,
        });
    } catch (error) {
        console.error('Error in applyLeave:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error applying for leave' });
        }
    }
};

export const approveLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        if (req.user?.role !== 'hr') {
            throw new AppError(403, 'Only HR can approve leaves');
        }

        const leaveRequest = await LeaveRequest.findByPk(id as string);

        if (!leaveRequest) {
            throw new AppError(404, 'Leave request not found');
        }

        if (leaveRequest.status !== 'pending') {
            throw new AppError(400, 'Leave request already processed');
        }

        // Update leave balance
        const balance = await LeaveBalance.findOne({
            where: {
                employee_id: leaveRequest.employee_id,
                leave_type: leaveRequest.leave_type,
                year: new Date(leaveRequest.start_date).getFullYear(),
            },
        });

        if (balance) {
            balance.used += leaveRequest.days;
            balance.remaining -= leaveRequest.days;
            await balance.save();
        }

        // Mark attendance as on_leave for the leave period
        const current = new Date(leaveRequest.start_date);
        const endDate = new Date(leaveRequest.end_date);
        const attendanceRecords = [];

        while (current <= endDate) {
            attendanceRecords.push({
                employee_id: leaveRequest.employee_id,
                date: new Date(current),
                status: 'on_leave' as const, // Cast to const to match enum
                is_locked: false,
            });
            current.setDate(current.getDate() + 1);
        }

        await AttendanceLog.bulkCreate(attendanceRecords, {
            updateOnDuplicate: ['status'],
        });

        // Update leave request
        leaveRequest.status = 'approved';
        leaveRequest.approved_by = req.user.id;
        leaveRequest.approved_at = new Date();
        leaveRequest.remarks = remarks;
        await leaveRequest.save();

        res.json({
            message: 'Leave approved successfully',
            leaveRequest,
        });
    } catch (error) {
        console.error('Error in approveLeave:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error approving leave' });
        }
    }
};

export const rejectLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        if (req.user?.role !== 'hr') {
            throw new AppError(403, 'Only HR can reject leaves');
        }

        const leaveRequest = await LeaveRequest.findByPk(id as string);

        if (!leaveRequest) {
            throw new AppError(404, 'Leave request not found');
        }

        if (leaveRequest.status !== 'pending') {
            throw new AppError(400, 'Leave request already processed');
        }

        leaveRequest.status = 'rejected';
        leaveRequest.approved_by = req.user.id;
        leaveRequest.approved_at = new Date();
        leaveRequest.remarks = remarks;
        await leaveRequest.save();

        res.json({
            message: 'Leave rejected',
            leaveRequest,
        });
    } catch (error) {
        console.error('Error in rejectLeave:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error rejecting leave' });
        }
    }
};

export const cancelLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const leaveRequest = await LeaveRequest.findByPk(id as string);

        if (!leaveRequest) {
            throw new AppError(404, 'Leave request not found');
        }

        if (leaveRequest.employee_id !== req.user?.id && req.user?.role !== 'hr') {
            throw new AppError(403, 'You can only cancel your own leave requests');
        }

        if (leaveRequest.status === 'approved') {
            // Restore leave balance
            const balance = await LeaveBalance.findOne({
                where: {
                    employee_id: leaveRequest.employee_id,
                    leave_type: leaveRequest.leave_type,
                    year: new Date(leaveRequest.start_date).getFullYear(),
                },
            });

            if (balance) {
                balance.used -= leaveRequest.days;
                balance.remaining += leaveRequest.days;
                await balance.save();
            }
        }

        leaveRequest.status = 'cancelled';
        await leaveRequest.save();

        res.json({
            message: 'Leave cancelled successfully',
            leaveRequest,
        });
    } catch (error) {
        console.error('Error in cancelLeave:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error cancelling leave' });
        }
    }
};
