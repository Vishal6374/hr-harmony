import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import Designation from '../models/Designation';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';

export const getAllDesignations = async (req: AuthRequest, res: Response): Promise<void> => {
    const { search, department_id } = req.query;

    const where: any = {};

    if (search) {
        where.name = { [Op.like]: `%${search}%` };
    }

    if (department_id) {
        where.department_id = department_id;
    }

    const designations = await Designation.findAll({
        where,
        include: [
            { association: 'department', attributes: ['id', 'name', 'code'] },
        ],
        order: [['level', 'ASC'], ['created_at', 'DESC']],
    });

    res.json(designations);
};

export const getDesignationById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const designation = await Designation.findByPk(id as string, {
        include: [
            { association: 'department', attributes: ['id', 'name', 'code'] },
        ],
    });

    if (!designation) {
        throw new AppError(404, 'Designation not found');
    }

    res.json(designation);
};

export const createDesignation = async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, department_id, level, salary_range_min, salary_range_max } = req.body;

    const designation = await Designation.create({
        name,
        department_id,
        level,
        salary_range_min,
        salary_range_max,
        is_active: true,
    });

    res.status(201).json({
        message: 'Designation created successfully',
        designation,
    });
};

export const updateDesignation = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, department_id, level, salary_range_min, salary_range_max, is_active } = req.body;

    const designation = await Designation.findByPk(id as string);

    if (!designation) {
        throw new AppError(404, 'Designation not found');
    }

    if (name !== undefined) designation.name = name;
    if (department_id !== undefined) designation.department_id = department_id;
    if (level !== undefined) designation.level = level;
    if (salary_range_min !== undefined) designation.salary_range_min = salary_range_min;
    if (salary_range_max !== undefined) designation.salary_range_max = salary_range_max;
    if (is_active !== undefined) designation.is_active = is_active;

    await designation.save();

    res.json({
        message: 'Designation updated successfully',
        designation,
    });
};

export const deleteDesignation = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const designation = await Designation.findByPk(id as string);

    if (!designation) {
        throw new AppError(404, 'Designation not found');
    }

    // Check if designation has employees
    const employeeCount = await User.count({ where: { designation_id: id } });

    if (employeeCount > 0) {
        throw new AppError(400, 'Cannot delete designation with employees');
    }

    await designation.destroy();

    res.json({ message: 'Designation deleted successfully' });
};
