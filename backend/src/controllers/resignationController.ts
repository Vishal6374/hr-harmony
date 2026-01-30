import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Resignation from '../models/Resignation';
import { AppError } from '../middleware/errorHandler';

export const getResignations = async (req: AuthRequest, res: Response): Promise<void> => {
    const { status, employee_id } = req.query;

    const where: any = {};

    // If not HR/Admin, only show own resignations
    if (req.user?.role !== 'hr' && req.user?.role !== 'admin') {
        where.employee_id = req.user?.id;
    } else if (employee_id) {
        where.employee_id = employee_id;
    }

    if (status) {
        where.status = status;
    }

    const resignations = await Resignation.findAll({
        where,
        include: [
            {
                association: 'employee',
                attributes: ['id', 'name', 'email', 'employee_id'],
            },
        ],
        order: [['created_at', 'DESC']],
    });

    res.json(resignations);
};

export const applyResignation = async (req: AuthRequest, res: Response): Promise<void> => {
    const { reason, preferred_last_working_day } = req.body;
    const employee_id = req.user?.id;

    if (!employee_id) {
        throw new AppError(401, 'Authentication required');
    }

    // Check if there's already a pending resignation
    const existing = await Resignation.findOne({
        where: {
            employee_id,
            status: 'pending',
        },
    });

    if (existing) {
        throw new AppError(400, 'You already have a pending resignation request');
    }

    const resignation = await Resignation.create({
        employee_id,
        reason,
        preferred_last_working_day: new Date(preferred_last_working_day),
        status: 'pending',
    });

    res.status(201).json({
        message: 'Resignation request submitted successfully',
        resignation,
    });
};

export const approveResignation = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { approved_last_working_day, hr_remarks } = req.body;

    const resignation = await Resignation.findByPk(id as string);

    if (!resignation) {
        throw new AppError(404, 'Resignation request not found');
    }

    if (resignation.status !== 'pending') {
        throw new AppError(400, `Cannot approve a resignation that is already ${resignation.status}`);
    }

    resignation.status = 'approved';
    resignation.approved_last_working_day = approved_last_working_day ? new Date(approved_last_working_day) : resignation.preferred_last_working_day;
    resignation.hr_remarks = hr_remarks;

    await resignation.save();

    res.json({
        message: 'Resignation request approved',
        resignation,
    });
};

export const rejectResignation = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { hr_remarks } = req.body;

    const resignation = await Resignation.findByPk(id as string);

    if (!resignation) {
        throw new AppError(404, 'Resignation request not found');
    }

    if (resignation.status !== 'pending') {
        throw new AppError(400, `Cannot reject a resignation that is already ${resignation.status}`);
    }

    resignation.status = 'rejected';
    resignation.hr_remarks = hr_remarks;

    await resignation.save();

    res.json({
        message: 'Resignation request rejected',
        resignation,
    });
};

export const withdrawResignation = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const employee_id = req.user?.id;

    const resignation = await Resignation.findByPk(id as string);

    if (!resignation) {
        throw new AppError(404, 'Resignation request not found');
    }

    if (resignation.employee_id !== employee_id && req.user?.role !== 'admin' && req.user?.role !== 'hr') {
        throw new AppError(403, 'Permission denied');
    }

    if (resignation.status !== 'pending') {
        throw new AppError(400, 'Only pending resignations can be withdrawn');
    }

    resignation.status = 'withdrawn';
    await resignation.save();

    res.json({
        message: 'Resignation request withdrawn successfully',
        resignation,
    });
};
