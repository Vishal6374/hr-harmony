import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Reimbursement from '../models/Reimbursement';
import { AppError } from '../middleware/errorHandler';

export const getReimbursements = async (req: AuthRequest, res: Response): Promise<void> => {
    const { status, employee_id } = req.query;

    const where: any = {};

    if (req.user?.role !== 'hr') {
        where.employee_id = req.user?.id;
    } else if (employee_id) {
        where.employee_id = employee_id;
    }

    if (status) {
        where.status = status;
    }

    const reimbursements = await Reimbursement.findAll({
        where,
        include: [
            { association: 'employee', attributes: ['id', 'name', 'email', 'employee_id'] },
            { association: 'approver', attributes: ['id', 'name', 'email'] },
        ],
        order: [['created_at', 'DESC']],
    });

    res.json(reimbursements);
};

export const submitReimbursement = async (req: AuthRequest, res: Response): Promise<void> => {
    const { category, amount, description, receipt_url } = req.body;

    const reimbursement = await Reimbursement.create({
        employee_id: req.user?.id,
        category,
        amount,
        description,
        receipt_url,
        status: 'pending',
    });

    res.status(201).json({
        message: 'Reimbursement submitted successfully',
        reimbursement,
    });
};

export const approveReimbursement = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { remarks } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can approve reimbursements');
    }

    const reimbursement = await Reimbursement.findByPk(id);

    if (!reimbursement) {
        throw new AppError(404, 'Reimbursement not found');
    }

    if (reimbursement.status !== 'pending') {
        throw new AppError(400, 'Reimbursement already processed');
    }

    reimbursement.status = 'approved';
    reimbursement.approved_by = req.user.id;
    reimbursement.approved_at = new Date();
    reimbursement.remarks = remarks;
    await reimbursement.save();

    res.json({
        message: 'Reimbursement approved successfully',
        reimbursement,
    });
};

export const rejectReimbursement = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { remarks } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can reject reimbursements');
    }

    const reimbursement = await Reimbursement.findByPk(id);

    if (!reimbursement) {
        throw new AppError(404, 'Reimbursement not found');
    }

    if (reimbursement.status !== 'pending') {
        throw new AppError(400, 'Reimbursement already processed');
    }

    reimbursement.status = 'rejected';
    reimbursement.approved_by = req.user.id;
    reimbursement.approved_at = new Date();
    reimbursement.remarks = remarks;
    await reimbursement.save();

    res.json({
        message: 'Reimbursement rejected',
        reimbursement,
    });
};
