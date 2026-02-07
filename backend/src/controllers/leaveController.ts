import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import LeaveRequest from '../models/LeaveRequest';
import LeaveBalance from '../models/LeaveBalance';
import AttendanceLog from '../models/AttendanceLog';
import { AppError } from '../middleware/errorHandler';
import { calculateWorkingDays } from '../utils/helpers';
import { Op } from 'sequelize';
import { logAudit } from '../utils/auditLogger';
import User from '../models/User';

export const getLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, employee_id } = req.query;

        const where: any = {};

        // If Admin, show everything
        // If HR, show everyone except Admins (wait, prompt says HR requests by Admin only, so HR should probably see them to manage them?)
        // Let's stick to: HR sees employees, Admin sees everyone.
        const isManagerRequest = req.query.view === 'manager';

        if (req.user?.role === 'admin') {
            if (isManagerRequest) {
                where.manager_id = req.user?.id;
            }
            // Admin sees all otherwise
        } else if (req.user?.role === 'hr') {
            if (isManagerRequest) {
                where.manager_id = req.user?.id;
            } else if (employee_id) {
                where.employee_id = employee_id;
            }
            // HR sees employees (except admins) handled by include.where
        } else {
            // Employees see only themselves or if they are a manager
            if (isManagerRequest) {
                where.manager_id = req.user?.id;
            } else {
                where.employee_id = req.user?.id;
            }
        }

        if (status && status !== 'all') {
            where.status = status;
        }

        const leaves = await LeaveRequest.findAll({
            where,
            include: [
                {
                    association: 'employee',
                    attributes: ['id', 'name', 'email', 'employee_id', 'role'],
                    where: req.user?.role === 'hr' ? { role: { [Op.ne]: 'admin' } } : undefined
                },
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

        // 1. Get Global Limits (Standard Types)
        const LeaveLimit = (await import('../models/LeaveLimit')).default;
        const LeaveType = (await import('../models/LeaveType')).default;

        let limits = await LeaveLimit.findOne();
        if (!limits) {
            limits = await LeaveLimit.create({ casual_leave: 12, sick_leave: 12, earned_leave: 15 });
        }

        // 2. Fetch all active custom leave types
        const customTypes = await LeaveType.findAll({ where: { status: 'active' } });

        // 3. Get Existing Key Balances
        const existingBalances = await LeaveBalance.findAll({
            where: {
                employee_id: targetEmployeeId,
                year: targetYear
            }
        });

        // Combine standard and custom types
        const typesToSync = [
            { id: 'casual', name: 'casual', limit: limits.casual_leave },
            { id: 'sick', name: 'sick', limit: limits.sick_leave },
            { id: 'earned', name: 'earned', limit: limits.earned_leave },
            ...customTypes.map(ct => ({ id: ct.id, name: ct.name.toLowerCase(), limit: ct.default_days_per_year }))
        ];

        // 4. Sync Balances
        for (const type of typesToSync) {
            let balance = existingBalances.find(b => b.leave_type === type.name);

            if (balance) {
                // Update total limit if changed by HR
                if (balance.total !== type.limit) {
                    balance.total = type.limit;
                    balance.remaining = Math.max(0, type.limit - balance.used);
                    await balance.save();
                }
            } else {
                // Initialize if missing
                await LeaveBalance.create({
                    employee_id: targetEmployeeId,
                    leave_type: type.name,
                    year: targetYear,
                    total: type.limit,
                    used: 0,
                    remaining: type.limit,
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

        // Auto-initialize balance if not found
        if (!balance) {
            const LeaveType = (await import('../models/LeaveType')).default;
            const typeDef = await LeaveType.findOne({ where: { name: { [Op.like]: leave_type } } });

            let limit = 12; // default fallback
            if (typeDef) {
                limit = typeDef.default_days_per_year;
            } else {
                // Try legacy limits
                const LeaveLimit = (await import('../models/LeaveLimit')).default;
                let limits = await LeaveLimit.findOne();
                if (limits) {
                    if (leave_type === 'casual') limit = limits.casual_leave;
                    else if (leave_type === 'sick') limit = limits.sick_leave;
                    else if (leave_type === 'privilege' || leave_type === 'earned') limit = limits.earned_leave;
                }
            }

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

        // Create leave request with multi-level workflow
        const applicant = await User.findByPk(employeeId);
        let managerId = applicant?.reporting_manager_id;
        let initialStatus: any = 'pending';

        if (managerId) {
            const manager = await User.findByPk(managerId);
            // If manager is HR or Admin, skip manager approval level
            if (manager?.role === 'hr' || manager?.role === 'admin') {
                initialStatus = 'pending_hr';
            } else {
                initialStatus = 'pending_manager';
            }
        } else {
            // No manager assigned, goes directly to HR
            initialStatus = 'pending_hr';
        }

        const leaveRequest = await LeaveRequest.create({
            employee_id: employeeId,
            leave_type,
            start_date: startDate,
            end_date: endDate,
            days,
            reason,
            status: initialStatus,
            manager_id: managerId,
            manager_status: managerId ? 'pending' : undefined
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

        if (req.user?.role !== 'hr' && req.user?.role !== 'admin') {
            throw new AppError(403, 'Permission denied');
        }

        const leaveRequest = await LeaveRequest.findByPk(id as string, {
            include: [{ association: 'employee', attributes: ['role'] }]
        });

        if (!leaveRequest) {
            throw new AppError(404, 'Leave request not found');
        }

        // Apply restricted logic: Requests by HR can only be approved by Admin
        const applicant = leaveRequest.get('employee') as any;
        if (applicant?.role === 'hr' && req.user.role !== 'admin') {
            throw new AppError(403, 'HR requests can only be approved by Admin');
        }

        // Prevent self-approval
        if (leaveRequest.employee_id === req.user.id) {
            throw new AppError(400, 'You cannot approve your own request');
        }

        if (leaveRequest.status !== 'pending' && leaveRequest.status !== 'pending_hr') {
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

        const targetUser = await User.findByPk(leaveRequest.employee_id, { attributes: ['name'] });
        await logAudit({
            action: `Approved ${leaveRequest.leave_type} leave for ${targetUser?.name || 'Employee'}: ${leaveRequest.days} days`,
            module: 'LEAVES',
            entity_type: 'LEAVE_REQUEST',
            entity_id: leaveRequest.id,
            performed_by: req.user.id,
            new_value: leaveRequest.toJSON(),
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
        });

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

        if (req.user?.role !== 'hr' && req.user?.role !== 'admin') {
            throw new AppError(403, 'Permission denied');
        }

        const leaveRequest = await LeaveRequest.findByPk(id as string, {
            include: [{ association: 'employee', attributes: ['role'] }]
        });

        if (!leaveRequest) {
            throw new AppError(404, 'Leave request not found');
        }

        // Apply restricted logic: Requests by HR can only be rejected by Admin
        const applicant = leaveRequest.get('employee') as any;
        if (applicant?.role === 'hr' && req.user.role !== 'admin') {
            throw new AppError(403, 'HR requests can only be rejected by Admin');
        }

        // Prevent self-rejection
        if (leaveRequest.employee_id === req.user.id) {
            throw new AppError(400, 'You cannot reject your own request');
        }

        if (leaveRequest.status !== 'pending' && leaveRequest.status !== 'pending_hr') {
            throw new AppError(400, 'Leave request already processed');
        }

        leaveRequest.status = 'rejected';
        leaveRequest.approved_by = req.user.id;
        leaveRequest.approved_at = new Date();
        leaveRequest.remarks = remarks;
        await leaveRequest.save();

        const targetUser = await User.findByPk(leaveRequest.employee_id, { attributes: ['name'] });
        await logAudit({
            action: `Rejected ${leaveRequest.leave_type} leave for ${targetUser?.name || 'Employee'}`,
            module: 'LEAVES',
            entity_type: 'LEAVE_REQUEST',
            entity_id: leaveRequest.id,
            performed_by: req.user.id,
            new_value: leaveRequest.toJSON(),
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
        });

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

export const updateLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { leave_type, start_date, end_date, reason } = req.body;

        const leaveRequest = await LeaveRequest.findByPk(id as string);

        if (!leaveRequest) {
            throw new AppError(404, 'Leave request not found');
        }

        if (leaveRequest.employee_id !== req.user?.id) {
            throw new AppError(403, 'You can only edit your own leave requests');
        }

        if (leaveRequest.status !== 'pending') {
            throw new AppError(400, 'Cannot edit request once it is processed');
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const days = calculateWorkingDays(startDate, endDate);

        // Update fields
        leaveRequest.leave_type = leave_type || leaveRequest.leave_type;
        leaveRequest.start_date = startDate;
        leaveRequest.end_date = endDate;
        leaveRequest.days = days;
        leaveRequest.reason = reason || leaveRequest.reason;

        await leaveRequest.save();

        res.json({
            message: 'Leave request updated successfully',
            leaveRequest,
        });
    } catch (error) {
        console.error('Error in updateLeave:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error updating leave' });
        }
    }
};

export const deleteLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const leaveRequest = await LeaveRequest.findByPk(id as string);

        if (!leaveRequest) {
            throw new AppError(404, 'Leave request not found');
        }

        if (leaveRequest.employee_id !== req.user?.id && req.user?.role !== 'admin') {
            throw new AppError(403, 'Permission denied');
        }

        if (leaveRequest.status !== 'pending' && req.user?.role !== 'admin') {
            throw new AppError(400, 'Cannot delete request once it is processed');
        }

        await leaveRequest.destroy();

        res.json({
            message: 'Leave request deleted successfully',
        });
    } catch (error) {
        console.error('Error in deleteLeave:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error deleting leave' });
        }
    }
};
export const managerApproveLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        const leaveRequest = await LeaveRequest.findByPk(id as string);
        if (!leaveRequest) throw new AppError(404, 'Leave request not found');

        if (leaveRequest.manager_id !== req.user?.id) {
            throw new AppError(403, 'Only assigned reporting manager can approve this level');
        }

        if (leaveRequest.status !== 'pending_manager') {
            throw new AppError(400, 'Request is not pending manager approval');
        }

        leaveRequest.manager_status = 'approved';
        leaveRequest.manager_remarks = remarks;
        leaveRequest.manager_approved_at = new Date();
        leaveRequest.status = 'pending_hr'; // Move to next level
        await leaveRequest.save();

        res.json({ message: 'Manager approval successful. Pending HR final approval.', leaveRequest });
    } catch (error) {
        console.error('Error in managerApproveLeave:', error);
        res.status(error instanceof AppError ? error.statusCode : 500).json({ message: error instanceof AppError ? error.message : 'Internal error' });
    }
};

export const managerRejectLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        const leaveRequest = await LeaveRequest.findByPk(id as string);
        if (!leaveRequest) throw new AppError(404, 'Leave request not found');

        if (leaveRequest.manager_id !== req.user?.id) {
            throw new AppError(403, 'Only assigned reporting manager can reject this');
        }

        leaveRequest.manager_status = 'rejected';
        leaveRequest.manager_remarks = remarks;
        leaveRequest.status = 'rejected_by_manager';
        await leaveRequest.save();

        res.json({ message: 'Leave request rejected by manager', leaveRequest });
    } catch (error) {
        console.error('Error in managerRejectLeave:', error);
        res.status(error instanceof AppError ? error.statusCode : 500).json({ message: error instanceof AppError ? error.message : 'Internal error' });
    }
};
