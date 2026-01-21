import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import User from '../models/User';
import LeaveBalance from '../models/LeaveBalance';
import { generateEmployeeId } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

export const getAllEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
    const { search, department_id, status, page = 1, limit = 50 } = req.query;

    const where: any = {};

    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { employee_id: { [Op.like]: `%${search}%` } },
        ];
    }

    if (department_id) {
        where.department_id = department_id;
    }

    if (status) {
        where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await User.findAndCountAll({
        where,
        include: [
            { association: 'department' },
            { association: 'designation' },
            { association: 'reportingManager', attributes: ['id', 'name', 'email'] },
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
    });

    res.json({
        employees: rows,
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit)),
    });
};

export const getEmployeeById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const employee = await User.findByPk(id, {
        include: [
            { association: 'department' },
            { association: 'designation' },
            { association: 'reportingManager', attributes: ['id', 'name', 'email'] },
            { association: 'leaveBalances' },
        ],
    });

    if (!employee) {
        throw new AppError(404, 'Employee not found');
    }

    res.json(employee);
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        name,
        email,
        password,
        phone,
        date_of_birth,
        date_of_joining,
        department_id,
        designation_id,
        reporting_manager_id,
        salary,
        role,
        address,
    } = req.body;

    // Generate employee ID
    const employee_id = await generateEmployeeId();

    // Create user
    const employee = await User.create({
        employee_id,
        name,
        email,
        password: password || 'Welcome@123', // Default password
        phone,
        date_of_birth,
        date_of_joining: date_of_joining || new Date(),
        department_id,
        designation_id,
        reporting_manager_id,
        salary: salary || 0,
        role: role || 'employee',
        status: 'active',
        address,
    });

    // Create default leave balances
    const currentYear = new Date().getFullYear();
    await LeaveBalance.bulkCreate([
        { employee_id: employee.id, leave_type: 'casual', total: 12, used: 0, remaining: 12, year: currentYear },
        { employee_id: employee.id, leave_type: 'sick', total: 10, used: 0, remaining: 10, year: currentYear },
        { employee_id: employee.id, leave_type: 'earned', total: 15, used: 0, remaining: 15, year: currentYear },
    ]);

    res.status(201).json({
        message: 'Employee created successfully',
        employee: employee.toJSON(),
    });
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
        name,
        phone,
        date_of_birth,
        department_id,
        designation_id,
        reporting_manager_id,
        status,
        address,
        avatar_url,
    } = req.body;

    const employee = await User.findByPk(id);

    if (!employee) {
        throw new AppError(404, 'Employee not found');
    }

    // Update allowed fields
    if (name !== undefined) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (date_of_birth !== undefined) employee.date_of_birth = date_of_birth;
    if (department_id !== undefined) employee.department_id = department_id;
    if (designation_id !== undefined) employee.designation_id = designation_id;
    if (reporting_manager_id !== undefined) employee.reporting_manager_id = reporting_manager_id;
    if (status !== undefined) employee.status = status;
    if (address !== undefined) employee.address = address;
    if (avatar_url !== undefined) employee.avatar_url = avatar_url;

    await employee.save();

    res.json({
        message: 'Employee updated successfully',
        employee: employee.toJSON(),
    });
};

export const deleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const employee = await User.findByPk(id);

    if (!employee) {
        throw new AppError(404, 'Employee not found');
    }

    // Soft delete by setting status to terminated
    employee.status = 'terminated';
    await employee.save();

    res.json({ message: 'Employee terminated successfully' });
};
