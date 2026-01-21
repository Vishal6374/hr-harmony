import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import PayrollBatch from '../models/PayrollBatch';
import SalarySlip from '../models/SalarySlip';
import User from '../models/User';
import AttendanceLog from '../models/AttendanceLog';
import Reimbursement from '../models/Reimbursement';
import { AppError } from '../middleware/errorHandler';
import { getDaysInMonth } from '../utils/helpers';

export const getPayrollBatches = async (_req: AuthRequest, res: Response): Promise<void> => {
    const batches = await PayrollBatch.findAll({
        include: [
            { association: 'processor', attributes: ['id', 'name', 'email'] },
        ],
        order: [['year', 'DESC'], ['month', 'DESC']],
    });

    res.json(batches);
};

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

export const generatePayroll = async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can generate payroll');
    }

    // Check if payroll already exists
    const existing = await PayrollBatch.findOne({
        where: { month, year },
    });

    if (existing) {
        throw new AppError(400, 'Payroll batch already exists for this month');
    }

    // Create payroll batch
    const batch = await PayrollBatch.create({
        month,
        year,
        status: 'draft',
        total_employees: 0,
        total_amount: 0,
        processed_by: req.user.id,
    });

    // Get all active employees
    const employees = await User.findAll({
        where: { status: 'active' },
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDays = getDaysInMonth(year, month);

    const salarySlips = [];
    let totalAmount = 0;

    for (const employee of employees) {
        // Get attendance for the month
        const attendance = await AttendanceLog.findAll({
            where: {
                employee_id: employee.id,
                date: { [Op.between]: [startDate, endDate] },
            },
        });

        // const presentDays = attendance.filter(a => a.status === 'present').length;
        const halfDays = attendance.filter(a => a.status === 'half_day').length;
        const absentDays = attendance.filter(a => a.status === 'absent').length;

        // Calculate salary components
        const dailySalary = employee.salary / totalDays;
        const basicSalary = employee.salary * 0.5;
        const hra = employee.salary * 0.3;
        const da = employee.salary * 0.2;

        // Get approved reimbursements for this month
        const reimbursements = await Reimbursement.findAll({
            where: {
                employee_id: employee.id,
                status: 'approved',
                payroll_batch_id: null as any,
            },
        });

        const totalReimbursements = reimbursements.reduce((sum, r) => sum + Number(r.amount), 0);

        // Calculate deductions
        const lossOfPay = (absentDays + halfDays * 0.5) * dailySalary;
        const pf = basicSalary * 0.12;
        const tax = employee.salary > 50000 ? employee.salary * 0.1 : 0;

        const grossSalary = employee.salary + totalReimbursements;
        const totalDeductions = pf + tax + lossOfPay;
        const netSalary = grossSalary - totalDeductions;

        // Create salary slip
        const slip = await SalarySlip.create({
            employee_id: employee.id,
            batch_id: batch.id,
            month,
            year,
            basic_salary: basicSalary,
            hra,
            da,
            reimbursements: totalReimbursements,
            deductions: {
                pf,
                tax,
                loss_of_pay: lossOfPay,
                other: 0,
            },
            gross_salary: grossSalary,
            net_salary: netSalary,
            status: 'draft',
            generated_at: new Date(),
        });

        // Mark reimbursements as included in payroll
        await Reimbursement.update(
            { payroll_batch_id: batch.id, status: 'paid' },
            { where: { id: reimbursements.map(r => r.id) } }
        );

        salarySlips.push(slip);
        totalAmount += netSalary;
    }

    // Update batch
    batch.total_employees = employees.length;
    batch.total_amount = totalAmount;
    batch.status = 'processed';
    batch.processed_at = new Date();
    await batch.save();

    res.json({
        message: 'Payroll generated successfully',
        batch,
        salarySlips,
    });
};

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

    // Lock attendance for this month
    const startDate = new Date(batch.year, batch.month - 1, 1);
    const endDate = new Date(batch.year, batch.month, 0);

    await AttendanceLog.update(
        { is_locked: true },
        {
            where: {
                date: { [Op.between]: [startDate, endDate] },
            },
        }
    );


    res.json({
        message: 'Payroll marked as paid and attendance locked',
        batch,
    });
};

export const getPayrollStats = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can view payroll stats');
    }

    // 1. Get Salary Trends (Last 6 Months)
    // For simplicity in this demo, we'll fetch all processed batches and format them
    const batches = await PayrollBatch.findAll({
        where: { status: { [Op.in]: ['processed', 'paid'] } },
        order: [['year', 'ASC'], ['month', 'ASC']],
        limit: 6
    });

    const trendData = batches.map(b => ({
        month: new Date(b.year, b.month - 1).toLocaleString('default', { month: 'short' }),
        amount: Number(b.total_amount)
    }));

    // 2. Department Cost Distribution (Mocked for now as we don't have direct linkage in batch easily accessible without complex join)
    // Ideally we would aggregate SalarySlip -> Employee -> Department
    const departmentData = [
        { name: 'Engineering', value: 450000 },
        { name: 'Sales', value: 250000 },
        { name: 'HR', value: 100000 },
        { name: 'Marketing', value: 150000 },
        { name: 'Product', value: 200000 },
    ];

    res.json({
        trendData,
        departmentData
    });
};

export const updateSalarySlip = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can update salary slips');
    }

    const { id } = req.params;
    const { basicSalary, hra, da, reimbursements, deductions } = req.body;

    const slip = await SalarySlip.findByPk(id as string);
    if (!slip) {
        throw new AppError(404, 'Salary slip not found');
    }

    if (slip.status === 'paid') {
        throw new AppError(400, 'Cannot update a paid salary slip');
    }

    // Update fields if provided
    if (basicSalary !== undefined) slip.basic_salary = Number(basicSalary);
    if (hra !== undefined) slip.hra = Number(hra);
    if (da !== undefined) slip.da = Number(da);
    if (reimbursements !== undefined) slip.reimbursements = Number(reimbursements);
    if (deductions !== undefined) slip.deductions = deductions;

    // Recalculate Totals
    slip.gross_salary = Number(slip.basic_salary) + Number(slip.hra) + Number(slip.da) + Number(slip.reimbursements);
    const totalDeductions = Number(slip.deductions.pf || 0) + Number(slip.deductions.tax || 0) + Number(slip.deductions.loss_of_pay || 0) + Number(slip.deductions.other || 0);
    slip.net_salary = slip.gross_salary - totalDeductions;

    await slip.save();

    res.json(slip);
};

export const createSalarySlip = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can create salary slips manually');
    }

    const { employeeId, month, year, basicSalary, hra, da, reimbursements, deductions } = req.body;

    // Basic validation
    if (!employeeId || !month || !year) {
        throw new AppError(400, 'Employee, month, and year are required');
    }

    // Find or create payroll batch for this month/year
    let batch = await PayrollBatch.findOne({
        where: { month, year }
    });

    if (!batch) {
        batch = await PayrollBatch.create({
            month,
            year,
            status: 'draft',
            total_employees: 0,
            total_amount: 0,
            processed_by: req.user.id,
        });
    }

    // Check if slip already exists
    const existingSlip = await SalarySlip.findOne({
        where: { employee_id: employeeId, month, year }
    });

    if (existingSlip) {
        throw new AppError(400, 'Salary slip already exists for this employee for this month');
    }

    // Calculate totals
    const grossSalary = Number(basicSalary || 0) + Number(hra || 0) + Number(da || 0) + Number(reimbursements || 0);
    const totalDeductions = Number(deductions?.pf || 0) + Number(deductions?.tax || 0) + Number(deductions?.loss_of_pay || 0) + Number(deductions?.other || 0);
    const netSalary = grossSalary - totalDeductions;

    const slip = await SalarySlip.create({
        employee_id: employeeId,
        batch_id: batch.id,
        month,
        year,
        basic_salary: Number(basicSalary || 0),
        hra: Number(hra || 0),
        da: Number(da || 0),
        reimbursements: Number(reimbursements || 0),
        deductions: deductions || { pf: 0, tax: 0, loss_of_pay: 0, other: 0 },
        gross_salary: grossSalary,
        net_salary: netSalary,
        status: 'draft',
        generated_at: new Date()
    });

    // Update batch totals
    await batch.increment('total_employees');
    await batch.increment('total_amount', { by: netSalary });

    res.status(201).json(slip);
};
