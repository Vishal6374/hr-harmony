import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import PayrollBatch from '../models/PayrollBatch';
import SalarySlip from '../models/SalarySlip';
import User from '../models/User';
import AttendanceLog from '../models/AttendanceLog';
import Reimbursement from '../models/Reimbursement';
import { AppError } from '../middleware/errorHandler';
import PayrollSettings from '../models/PayrollSettings';
import { logAudit } from '../utils/auditLogger';


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
            {
                association: 'employee',
                attributes: ['id', 'name', 'email', 'employee_id'],
                where: req.user?.role === 'hr' ? { id: req.user.id } : undefined
            },
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
    const whereUsers: any = { status: 'active' };
    if (req.user?.role === 'hr') {
        whereUsers.role = { [Op.ne]: 'admin' };
    }

    const employees = await User.findAll({
        where: whereUsers,
    });

    // Get payroll settings for defaults
    const payrollSettings = await PayrollSettings.findOne();
    const defaultPF = payrollSettings?.default_pf_percentage || 12;
    const defaultESI = payrollSettings?.default_esi_percentage || 0.75;
    const defaultAbsentType = payrollSettings?.default_absent_deduction_type || 'percentage';
    const defaultAbsentValue = payrollSettings?.default_absent_deduction_value || 3.33;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

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
        const totalAbsentEquivalent = absentDays + (halfDays * 0.5);
        let lossOfPay = 0;

        const absentDeductionType = employee.absent_deduction_type || defaultAbsentType;
        const absentDeductionValue = employee.absent_deduction_value || defaultAbsentValue;

        if (absentDeductionType === 'amount') {
            lossOfPay = totalAbsentEquivalent * absentDeductionValue;
        } else {
            const totalDaysInMonth = endDate.getDate();
            lossOfPay = totalAbsentEquivalent * (employee.salary / totalDaysInMonth) * (absentDeductionValue / 100);
        }

        const pf = basicSalary * ((employee.pf_percentage || defaultPF) / 100);
        const esi = employee.salary * ((employee.esi_percentage || defaultESI) / 100);
        const tax = employee.salary > 50000 ? employee.salary * 0.1 : 0;

        const grossSalary = employee.salary + totalReimbursements;
        const totalDeductions = pf + esi + tax + lossOfPay;
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
                esi,
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

    await logAudit({
        action: 'GENERATE',
        module: 'PAYROLL',
        entity_type: 'PAYROLL_BATCH',
        entity_id: batch.id,
        performed_by: req.user!.id,
        new_value: batch.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

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

    await logAudit({
        action: 'MARK_PAID',
        module: 'PAYROLL',
        entity_type: 'PAYROLL_BATCH',
        entity_id: batch.id,
        performed_by: req.user!.id,
        new_value: batch.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });
}

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

    const oldValues = slip.toJSON();
    await slip.save();

    await logAudit({
        action: 'UPDATE_SLIP',
        module: 'PAYROLL',
        entity_type: 'SALARY_SLIP',
        entity_id: slip.id,
        performed_by: req.user!.id,
        old_value: oldValues,
        new_value: slip.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

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

// ==========================================
// UNIFIED PAYROLL HELPERS & CONTROLLERS
// ==========================================

const round = (value: number) => Math.round(value);

const calculatePayrollComponents = async (employee: any, month: number, year: number, bonus: number = 0, otherDeduction: number = 0, settings: any) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDaysInMonth = endDate.getDate();

    // Get attendance
    const attendance = await AttendanceLog.findAll({
        where: {
            employee_id: employee.id,
            date: { [Op.between]: [startDate, endDate] },
        },
    });

    const presentDays = attendance.filter(a => a.status === 'present').length;
    const halfDays = attendance.filter(a => a.status === 'half_day').length;
    const absentDaysCount = attendance.filter(a => a.status === 'absent').length;

    // Basic = 50% of Salary, HRA = 30%, DA = 20%
    const basicSalary = round(employee.salary * 0.5);
    const hra = round(employee.salary * 0.3);
    const da = round(employee.salary * 0.2);

    // Get approved reimbursements (not yet processed)
    const reimbursements = await Reimbursement.findAll({
        where: {
            employee_id: employee.id,
            status: 'approved',
            payroll_batch_id: null as any,
        },
    });
    const totalReimbursements = round(reimbursements.reduce((sum, r) => sum + Number(r.amount), 0));

    // Calculate deductions
    const totalAbsentEquivalent = absentDaysCount + (halfDays * 0.5);
    let lossOfPay = 0;

    const defaultAbsentType = settings?.default_absent_deduction_type || 'percentage';
    const defaultAbsentValue = settings?.default_absent_deduction_value || 3.33;

    const absentDeductionType = employee.absent_deduction_type || defaultAbsentType;
    const absentDeductionValue = employee.absent_deduction_value || defaultAbsentValue;

    if (absentDeductionType === 'amount') {
        lossOfPay = round(totalAbsentEquivalent * absentDeductionValue);
    } else {
        lossOfPay = round(totalAbsentEquivalent * (employee.salary / totalDaysInMonth) * (absentDeductionValue / 100));
    }

    const defaultPF = settings?.default_pf_percentage || 12;
    const defaultESI = settings?.default_esi_percentage || 0.75;

    const pf = round(basicSalary * ((employee.pf_percentage || defaultPF) / 100));
    const esi = round(employee.salary * ((employee.esi_percentage || defaultESI) / 100));
    const tax = round(employee.salary > 50000 ? employee.salary * 0.1 : 0);

    const grossSalary = basicSalary + hra + da + totalReimbursements + bonus;
    const totalDeductions = pf + esi + tax + lossOfPay + otherDeduction;
    const netSalary = grossSalary - totalDeductions;

    return {
        basic_salary: basicSalary,
        hra,
        da,
        reimbursements: totalReimbursements,
        bonus,
        deductions: {
            pf,
            esi,
            tax,
            loss_of_pay: lossOfPay,
            other: otherDeduction
        },
        gross_salary: grossSalary,
        net_salary: netSalary,
        attendance_summary: {
            total_days: totalDaysInMonth,
            present_days: presentDays + (halfDays * 0.5),
            absent_days: totalAbsentEquivalent
        },
        reimbursementRecords: reimbursements
    };
};

export const previewPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year, employee_ids } = req.body;

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        throw new AppError(400, 'Please select at least one employee');
    }

    const payrollSettings = await PayrollSettings.findOne();
    const where: any = { id: { [Op.in]: employee_ids } };
    if (req.user?.role === 'hr') {
        where.role = { [Op.ne]: 'admin' };
    }

    const employees = await User.findAll({
        where,
        include: [{ association: 'department' }]
    });

    const previewData = [];

    for (const employee of employees) {
        const calc = await calculatePayrollComponents(employee, month, year, 0, 0, payrollSettings);

        previewData.push({
            employee_id: employee.id,
            employee_name: employee.name,
            employee_code: employee.employee_id,
            role: employee.role,
            department: employee.department,
            basic_salary: calc.basic_salary,
            net_salary: calc.net_salary,
            bonus: calc.bonus,
            lop: calc.deductions.loss_of_pay,
            pf: calc.deductions.pf,
            esi: calc.deductions.esi,
            tax: calc.deductions.tax,
            other_deductions: calc.deductions.other,
            present_days: calc.attendance_summary.present_days,
            absent_days: calc.attendance_summary.absent_days,
            total_days: calc.attendance_summary.total_days
        });
    }

    res.json({ data: previewData });
};

export const processPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year, employee_ids, bonuses = {}, deductions = {} } = req.body;

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        throw new AppError(400, 'Please select at least one employee');
    }

    let batch = await PayrollBatch.findOne({ where: { month, year } });

    if (batch && batch.status === 'paid') {
        throw new AppError(400, 'Payroll for this month has already been paid and locked.');
    }

    if (!batch) {
        batch = await PayrollBatch.create({
            month,
            year,
            status: 'processed',
            total_employees: 0,
            total_amount: 0,
            processed_by: req.user!.id,
            processed_at: new Date()
        });
    } else {
        batch.status = 'processed';
        batch.processed_at = new Date();
        batch.processed_by = req.user!.id;
        await batch.save();
    }

    const payrollSettings = await PayrollSettings.findOne();
    const whereUsers: any = { id: { [Op.in]: employee_ids } };
    if (req.user?.role === 'hr') {
        whereUsers.role = { [Op.ne]: 'admin' };
    }

    const employees = await User.findAll({
        where: whereUsers
    });

    let batchTotalAmount = 0;

    for (const employee of employees) {
        const bonus = Number(bonuses[employee.id]) || 0;
        const otherDeduction = Number(deductions[employee.id]) || 0;

        const calc = await calculatePayrollComponents(employee, month, year, bonus, otherDeduction, payrollSettings);

        let slip = await SalarySlip.findOne({
            where: { batch_id: batch.id, employee_id: employee.id }
        });

        if (slip) {
            slip.basic_salary = calc.basic_salary;
            slip.hra = calc.hra;
            slip.da = calc.da;
            slip.reimbursements = calc.reimbursements;
            slip.deductions = calc.deductions;
            slip.gross_salary = calc.gross_salary;
            slip.net_salary = calc.net_salary;
            slip.status = 'draft';
            await slip.save();
        } else {
            slip = await SalarySlip.create({
                employee_id: employee.id,
                batch_id: batch.id,
                month,
                year,
                basic_salary: calc.basic_salary,
                hra: calc.hra,
                da: calc.da,
                reimbursements: calc.reimbursements,
                deductions: calc.deductions,
                gross_salary: calc.gross_salary,
                net_salary: calc.net_salary,
                status: 'draft',
                generated_at: new Date()
            });
        }
        batchTotalAmount += calc.net_salary;

        if (calc.reimbursementRecords.length > 0) {
            await Reimbursement.update(
                { payroll_batch_id: batch.id, status: 'paid' },
                { where: { id: calc.reimbursementRecords.map(r => r.id) } }
            );
        }
    }

    const allSlipsInBatch = await SalarySlip.findAll({ where: { batch_id: batch.id } });
    batch.total_employees = allSlipsInBatch.length;
    batch.total_amount = allSlipsInBatch.reduce((sum, s) => sum + Number(s.net_salary), 0);
    await batch.save();

    await logAudit({
        action: 'PROCESS_PAYROLL',
        module: 'PAYROLL',
        entity_type: 'PAYROLL_BATCH',
        entity_id: batch.id,
        performed_by: req.user!.id,
        new_value: { month, year, count: employees.length },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.json({
        message: 'Payroll processed successfully',
        batch_id: batch.id
    });
};
