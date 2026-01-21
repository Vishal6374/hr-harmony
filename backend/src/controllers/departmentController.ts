import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import Department from '../models/Department';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';

export const getAllDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
    const { search } = req.query;

    const where: any = {};

    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { code: { [Op.like]: `%${search}%` } },
        ];
    }

    const departments = await Department.findAll({
        where,
        include: [
            { association: 'manager', attributes: ['id', 'name', 'email'] },
        ],
        order: [['created_at', 'DESC']],
    });

    res.json(departments);
};

export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const department = await Department.findByPk(id, {
        include: [
            { association: 'manager', attributes: ['id', 'name', 'email'] },
            { association: 'employees', attributes: ['id', 'name', 'email', 'employee_id'] },
        ],
    });

    if (!department) {
        throw new AppError(404, 'Department not found');
    }

    res.json(department);
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, code, manager_id } = req.body;

    const department = await Department.create({
        name,
        code,
        manager_id,
        employee_count: 0,
        is_active: true,
    });

    res.status(201).json({
        message: 'Department created successfully',
        department,
    });
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, code, manager_id, is_active } = req.body;

    const department = await Department.findByPk(id);

    if (!department) {
        throw new AppError(404, 'Department not found');
    }

    if (name !== undefined) department.name = name;
    if (code !== undefined) department.code = code;
    if (manager_id !== undefined) department.manager_id = manager_id;
    if (is_active !== undefined) department.is_active = is_active;

    await department.save();

    res.json({
        message: 'Department updated successfully',
        department,
    });
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const department = await Department.findByPk(id);

    if (!department) {
        throw new AppError(404, 'Department not found');
    }

    // Check if department has employees
    const employeeCount = await User.count({ where: { department_id: id } });

    if (employeeCount > 0) {
        throw new AppError(400, 'Cannot delete department with employees');
    }

    await department.destroy();

    res.json({ message: 'Department deleted successfully' });
};
