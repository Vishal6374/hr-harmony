import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import PayrollBatch from '../models/PayrollBatch';
import SalarySlip from '../models/SalarySlip';
import User from '../models/User';
import AttendanceLog from '../models/AttendanceLog';
import { AppError } from '../middleware/errorHandler';
import { getDaysInMonth } from '../utils/helpers';

// Get all payroll batches
export const getPayrollBatches = async (_req: AuthRequest, res: Response): Promise<void> => {
    const batches = await PayrollBatch.findAll({
        include: [
            { association: 'processor', attributes: ['id', 'name', 'email'] },
        ],
        order: [['year', 'DESC'], ['month', 'DESC']],
    });

    res.json(batches);
};

// Get salary slips
export const getSalarySlips = async (req: AuthRequest, res: Response): Promise<void> => {
    const { employee_id, month, year } = req.query;

    const where: any = {};

    // If not HR, only show own salary slips
    if (req.user?.role !== 'hr') {
        where.employee_id = req.user?.id;
    } else if (employee_id) {
        where.employee_id = employee_id;
    }

    if (month) where.month = month;
    if (year) where.year = year;

    const slips = await SalarySlip.findAll({
        where,
        include: [
            { association: 'employee', attributes: ['id', 'name', 'email', 'employee_id'] },
            { association: 'batch' },
        ],
        order: [['year', 'DESC'], ['month', 'DESC']],
    });

    res.json(slips);
};

// Process payroll for selected employees
export const processPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year, employee_ids, bonuses, deductions } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can process payroll');
    }

    // Validate inputs
    if (!month || !year || !employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        throw new AppError(400, 'Month, year, and employee_ids are required');
    }

    // Check if payroll already exists for this month
    const existing = await PayrollBatch.findOne({
        where: { month, year },
    });

    let batch;
    if (existing) {
        // Delete old salary slips for this batch
        await SalarySlip.destroy({ where: { batch_id: existing.id } });
        batch = existing;
    } else {
        // Create new payroll batch
        batch = await PayrollBatch.create({
            month,
            year,
            status: 'draft',
            total_employees: 0,
            total_amount: 0,
            processed_by: req.user.id,
        });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDays = getDaysInMonth(year, month);

    const salarySlips = [];
    let totalAmount = 0;

    // Process each selected employee
    for (const employeeId of employee_ids) {
        const employee = await User.findByPk(employeeId);

        if (!employee) continue;

        // Get attendance for the month
        const attendance = await AttendanceLog.findAll({
            where: {
                employee_id: employeeId,
                date: { [Op.between]: [startDate, endDate] },
            },
        });

        // Calculate present and absent days
        const presentDays = attendance.filter(a =>
            a.status === 'present' || a.status === 'half_day' || a.status === 'on_leave' || a.status === 'weekend' || a.status === 'holiday'
        ).length;
        const absentDays = attendance.filter(a => a.status === 'absent').length;

        // Calculate LOP (Loss of Pay)
        const dailySalary = employee.salary / totalDays;
        const lop = absentDays * dailySalary;

        // Get bonus and deductions for this employee
        const bonus = bonuses?.[employeeId] || 0;
        const otherDeductions = deductions?.[employeeId] || 0;

        // Calculate salaries
        const basicSalary = employee.salary;
        const grossSalary = basicSalary + bonus;
        const totalDeductions = lop + otherDeductions;
        const netSalary = grossSalary - totalDeductions;

        // Create salary slip
        const slip = await SalarySlip.create({
            employee_id: employeeId,
            batch_id: batch.id,
            month,
            year,
            basic_salary: basicSalary,
            bonus,
            lop,
            other_deductions: otherDeductions,
            gross_salary: grossSalary,
            net_salary: netSalary,
            present_days: presentDays,
            absent_days: absentDays,
            total_days: totalDays,
            status: 'processed',
            generated_at: new Date(),
        });

        salarySlips.push(slip);
        totalAmount += netSalary;
    }

    // Update batch
    batch.total_employees = salarySlips.length;
    batch.total_amount = totalAmount;
    batch.status = 'processed';
    batch.processed_at = new Date();
    await batch.save();

    res.json({
        message: 'Payroll processed successfully',
        batch,
        salarySlips,
    });
};

// Mark payroll as paid
export const markPayrollPaid = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can mark payroll as paid');
    }

    const batch = await PayrollBatch.findByPk(id as string);

    if (!batch) {
        throw new AppError(404, 'Payroll batch not found');
    }

    if (batch.status === 'paid') {
        throw new AppError(400, 'Payroll already marked as paid');
    }

    // Update batch
    batch.status = 'paid';
    batch.paid_at = new Date();
    await batch.save();

    // Update all salary slips
    await SalarySlip.update(
        { status: 'paid' },
        { where: { batch_id: id } }
    );

    res.json({
        message: 'Payroll marked as paid',
        batch,
    });
};

// Preview payroll before processing
export const previewPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year, employee_ids } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can preview payroll');
    }

    if (!month || !year || !employee_ids || !Array.isArray(employee_ids)) {
        throw new AppError(400, 'Month, year, and employee_ids are required');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDays = getDaysInMonth(year, month);

    const previews = [];

    for (const employeeId of employee_ids) {
        const employee = await User.findByPk(employeeId, {
            include: [
                { association: 'department', attributes: ['name'] },
                { association: 'designation', attributes: ['name'] },
            ],
        });

        if (!employee) continue;

        // Get attendance
        const attendance = await AttendanceLog.findAll({
            where: {
                employee_id: employeeId,
                date: { [Op.between]: [startDate, endDate] },
            },
        });

        const presentDays = attendance.filter(a =>
            a.status === 'present' || a.status === 'half_day' || a.status === 'on_leave' || a.status === 'weekend' || a.status === 'holiday'
        ).length;
        const absentDays = attendance.filter(a => a.status === 'absent').length;

        const dailySalary = employee.salary / totalDays;
        const lop = absentDays * dailySalary;

        previews.push({
            employee_id: employeeId,
            employee_name: employee.name,
            employee_code: employee.employee_id,
            department: (employee as any).department?.name,
            designation: (employee as any).designation?.name,
            basic_salary: employee.salary,
            present_days: presentDays,
            absent_days: absentDays,
            total_days: totalDays,
            lop,
            gross_salary: employee.salary,
            net_salary: employee.salary - lop,
        });
    }

    res.json(previews);
};
