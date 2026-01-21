import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Policy from '../models/Policy';
import { AppError } from '../middleware/errorHandler';

export const getPolicies = async (req: AuthRequest, res: Response): Promise<void> => {
    const { category, is_active } = req.query;

    const where: any = {};

    if (category) {
        where.category = category;
    }

    if (is_active !== undefined) {
        where.is_active = is_active === 'true';
    }

    const policies = await Policy.findAll({
        where,
        order: [['effective_date', 'DESC']],
    });

    res.json(policies);
};

export const getPolicyById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const policy = await Policy.findByPk(id);

    if (!policy) {
        throw new AppError(404, 'Policy not found');
    }

    res.json(policy);
};

export const createPolicy = async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, category, version, document_url, effective_date } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can create policies');
    }

    const policy = await Policy.create({
        title,
        category,
        version,
        document_url,
        effective_date,
        is_active: true,
    });

    res.status(201).json({
        message: 'Policy created successfully',
        policy,
    });
};

export const updatePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, category, version, document_url, effective_date, is_active } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can update policies');
    }

    const policy = await Policy.findByPk(id);

    if (!policy) {
        throw new AppError(404, 'Policy not found');
    }

    if (title !== undefined) policy.title = title;
    if (category !== undefined) policy.category = category;
    if (version !== undefined) policy.version = version;
    if (document_url !== undefined) policy.document_url = document_url;
    if (effective_date !== undefined) policy.effective_date = effective_date;
    if (is_active !== undefined) policy.is_active = is_active;

    await policy.save();

    res.json({
        message: 'Policy updated successfully',
        policy,
    });
};

export const deletePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can delete policies');
    }

    const policy = await Policy.findByPk(id);

    if (!policy) {
        throw new AppError(404, 'Policy not found');
    }

    await policy.destroy();

    res.json({ message: 'Policy deleted successfully' });
};
