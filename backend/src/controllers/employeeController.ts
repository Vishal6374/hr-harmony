import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import User from '../models/User';
import LeaveBalance from '../models/LeaveBalance';
import { generateEmployeeId } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../utils/auditLogger';
import { upload, getFileUrl } from '../utils/fileUpload';


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

    // Hide admins from HR users
    if (req.user?.role === 'hr') {
        where.role = { [Op.ne]: 'admin' };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await User.findAndCountAll({
        where,
        include: [
            { association: 'department' },
            { association: 'designation' },
            { association: 'reportingManager', attributes: ['id', 'name', 'email'] },
            { association: 'documents' },
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

export const avatarUpload = upload;

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
        throw new AppError(400, 'Please upload an image file');
    }
    const url = getFileUrl(req, req.file.filename);
    res.json({ url });
};

export const getEmployeeById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const employee = await User.findByPk(id as string, {
        include: [
            { association: 'department' },
            { association: 'designation' },
            { association: 'reportingManager', attributes: ['id', 'name', 'email'] },
            { association: 'leaveBalances' },
            { association: 'documents' },
        ],
    });

    if (!employee) {
        throw new AppError(404, 'Employee not found');
    }

    // Hide admin from HR
    if (req.user?.role === 'hr' && employee.role === 'admin') {
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
        bank_name,
        account_number,
        ifsc_code,
        branch_name,
        pf_percentage,
        esi_percentage,
        absent_deduction_type,
        absent_deduction_value,
        education,
        aadhaar_number,
        pan_number,
        custom_fields,
    } = req.body;

    const PayrollSettings = (await import('../models/PayrollSettings')).default;
    const settings = await PayrollSettings.findOne();


    // Generate employee ID
    const employee_id = await generateEmployeeId();

    // Security: HR cannot create HR/Admin roles
    if (req.user?.role === 'hr' && (role === 'admin' || role === 'hr')) {
        throw new AppError(403, 'HR Administrator cannot create System Admin or HR roles');
    }

    // Create user
    const employee = await User.create({
        employee_id,
        name,
        email,
        password: password || 'emp123', // Default password per requirement
        phone,
        date_of_birth: date_of_birth === '' ? null : date_of_birth,
        date_of_joining: date_of_joining || new Date(),
        department_id,
        designation_id,
        reporting_manager_id,
        salary: salary || 0,
        role: role || 'employee',
        status: 'active',
        pf_percentage: (pf_percentage !== undefined && pf_percentage !== '') ? pf_percentage : settings?.default_pf_percentage,
        esi_percentage: (esi_percentage !== undefined && esi_percentage !== '') ? esi_percentage : settings?.default_esi_percentage,
        absent_deduction_type: (absent_deduction_type !== undefined && absent_deduction_type !== '') ? absent_deduction_type : settings?.default_absent_deduction_type,
        absent_deduction_value: (absent_deduction_value !== undefined && absent_deduction_value !== '') ? absent_deduction_value : settings?.default_absent_deduction_value,
        address,
        bank_name,
        account_number,
        ifsc_code,
        branch_name,
        education,
        aadhaar_number,
        pan_number,
        custom_fields,
    });

    // Create default leave balances
    const currentYear = new Date().getFullYear();
    await LeaveBalance.bulkCreate([
        { employee_id: employee.id, leave_type: 'casual', total: 12, used: 0, remaining: 12, year: currentYear },
        { employee_id: employee.id, leave_type: 'sick', total: 10, used: 0, remaining: 10, year: currentYear },
        { employee_id: employee.id, leave_type: 'earned', total: 15, used: 0, remaining: 15, year: currentYear },
    ]);

    await logAudit({
        action: 'CREATE',
        module: 'EMPLOYEE',
        entity_type: 'USER',
        entity_id: employee.id,
        performed_by: req.user!.id,
        new_value: employee.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

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
        salary,
        role,
        bank_name,
        account_number,
        ifsc_code,
        branch_name,
        pf_percentage,
        esi_percentage,
        absent_deduction_type,
        absent_deduction_value,
        termination_date,
        termination_reason,
        education,
        aadhaar_number,
        pan_number,
        custom_fields,
    } = req.body;


    const employee = await User.findByPk(id as string);

    if (!employee) {
        throw new AppError(404, 'Employee not found');
    }

    // Restriction: Employees can only edit their own profile within 48 hours of onboarding
    if (req.user?.role === 'employee') {
        const createdAt = new Date(employee.created_at);
        const now = new Date();
        const diffInHours = Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (diffInHours > 48) {
            throw new AppError(403, 'Profile editing is locked after 48 hours of onboarding. Please contact HR for updates.');
        }
    }

    // Security: HR cannot promote to HR/Admin roles
    if (req.user?.role === 'hr' && (role === 'admin' || role === 'hr') && role !== employee.role) {
        throw new AppError(403, 'HR Administrator cannot assign System Admin or HR roles');
    }

    // Update allowed fields
    if (name !== undefined) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (date_of_birth !== undefined) employee.date_of_birth = date_of_birth === '' ? null : date_of_birth;
    if (department_id !== undefined) employee.department_id = department_id === '' ? null : department_id;
    if (designation_id !== undefined) employee.designation_id = designation_id === '' ? null : designation_id;
    if (reporting_manager_id !== undefined) employee.reporting_manager_id = reporting_manager_id === '' ? null : reporting_manager_id;
    if (status !== undefined) employee.status = status;
    if (address !== undefined) employee.address = address;
    if (avatar_url !== undefined) employee.avatar_url = avatar_url;
    if (salary !== undefined) employee.salary = salary === '' ? 0 : salary;
    if (role !== undefined) employee.role = role;
    if (bank_name !== undefined) employee.bank_name = bank_name;
    if (account_number !== undefined) employee.account_number = account_number;
    if (ifsc_code !== undefined) employee.ifsc_code = ifsc_code;
    if (branch_name !== undefined) employee.branch_name = branch_name;
    if (pf_percentage !== undefined) employee.pf_percentage = pf_percentage === '' ? null : pf_percentage;
    if (esi_percentage !== undefined) employee.esi_percentage = esi_percentage === '' ? null : esi_percentage;
    if (absent_deduction_type !== undefined) employee.absent_deduction_type = absent_deduction_type === '' ? null : absent_deduction_type;
    if (absent_deduction_value !== undefined) employee.absent_deduction_value = absent_deduction_value === '' ? null : absent_deduction_value;
    if (termination_date !== undefined) employee.termination_date = termination_date === '' ? null : termination_date;
    if (termination_reason !== undefined) employee.termination_reason = termination_reason;
    if (education !== undefined) employee.education = education;
    if (aadhaar_number !== undefined) employee.aadhaar_number = aadhaar_number;
    if (pan_number !== undefined) employee.pan_number = pan_number;
    if (custom_fields !== undefined) {
        employee.custom_fields = custom_fields;
        // Force update for JSON fields in case Sequelize doesn't detect deep changes
        employee.changed('custom_fields', true);
    }

    // If status is changed to terminated, clear sensitive details
    if (status === 'terminated') {
        employee.phone = undefined;
        employee.address = undefined;
        employee.date_of_birth = undefined;
        employee.bank_name = undefined;
        employee.account_number = undefined;
        employee.ifsc_code = undefined;
        employee.branch_name = undefined;
        employee.salary = 0;
        employee.avatar_url = undefined;
        employee.pf_percentage = undefined;
        employee.esi_percentage = undefined;
        employee.absent_deduction_type = undefined;
        employee.absent_deduction_value = undefined;
    }

    const oldValues = employee.toJSON();
    await employee.save();

    await logAudit({
        action: 'UPDATE',
        module: 'EMPLOYEE',
        entity_type: 'USER',
        entity_id: employee.id,
        performed_by: req.user!.id,
        old_value: oldValues,
        new_value: employee.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.json({
        message: 'Employee updated successfully',
        employee: employee.toJSON(),
    });

};

export const terminateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { termination_date, termination_reason } = req.body;

    const employee = await User.findByPk(id as string);

    if (!employee) {
        throw new AppError(404, 'Employee not found');
    }

    if (employee.status === 'terminated') {
        throw new AppError(400, 'Employee is already terminated');
    }

    // Terminate employee
    employee.status = 'terminated';
    employee.termination_date = termination_date ? new Date(termination_date) : new Date();
    employee.termination_reason = termination_reason || 'No reason provided';

    const oldValues = employee.toJSON();
    await employee.save();

    await logAudit({
        action: 'TERMINATE',
        module: 'EMPLOYEE',
        entity_type: 'USER',
        entity_id: employee.id,
        performed_by: req.user!.id,
        old_value: oldValues,
        new_value: employee.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.json({
        message: 'Employee terminated successfully',
        employee: employee.toJSON(),
    });

};

export const permanentlyDeleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const employee = await User.findByPk(id as string);

    if (!employee) {
        throw new AppError(404, 'Employee not found');
    }

    try {
        // Hard delete - permanently remove from database
        await employee.destroy();

        res.json({ message: 'Employee permanently deleted from system' });
    } catch (error: any) {
        console.error('Error permanently deleting employee:', error);

        // Check if it's a foreign key constraint error
        if (error.name === 'SequelizeForeignKeyConstraintError' || error.original?.code === 'ER_ROW_IS_REFERENCED_2') {
            throw new AppError(
                400,
                'Cannot permanently delete employee. Employee has associated records (attendance, leaves, payroll, etc.). Please use "Terminate" instead to preserve data while revoking access.'
            );
        }

        throw new AppError(500, 'Failed to permanently delete employee: ' + (error.message || 'Unknown error'));
    }
};

// Soft delete (kept for backward compatibility)
export const deleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const employee = await User.findByPk(id as string);

    if (!employee) {
        throw new AppError(404, 'Employee not found');
    }

    // Soft delete by setting status to terminated
    employee.status = 'terminated';
    employee.termination_date = new Date();
    employee.termination_reason = 'Soft delete';
    await employee.save();

    res.json({ message: 'Employee terminated successfully' });
};
