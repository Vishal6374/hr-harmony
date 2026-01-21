import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import SalaryStructure from '../models/SalaryStructure';
import PayGroup from '../models/PayGroup';
import TaxSlab from '../models/TaxSlab';
import InvestmentDeclaration from '../models/InvestmentDeclaration';
import LoanAdvance from '../models/LoanAdvance';
import FFSettlement from '../models/FFSettlement';
import PayrollAudit from '../models/PayrollAudit';
import SalarySlip from '../models/SalarySlip';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';

// ============ SALARY STRUCTURE CONTROLLERS ============
export const getSalaryStructures = async (_req: AuthRequest, res: Response): Promise<void> => {
    const structures = await SalaryStructure.findAll({
        order: [['created_at', 'DESC']],
    });
    res.json(structures);
};

export const createSalaryStructure = async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, description, components, deduction_rules } = req.body;

    const structure = await SalaryStructure.create({
        name,
        description,
        components,
        deduction_rules,
        is_active: true,
    });

    // Create audit log
    await PayrollAudit.create({
        entity_type: 'salary_structure',
        entity_id: structure.id,
        action: 'created',
        changed_by: req.user!.id,
        changes: [{ field: 'all', old_value: null, new_value: structure }],
    });

    res.status(201).json(structure);
};

export const updateSalaryStructure = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, components, deduction_rules, is_active } = req.body;

    const structure = await SalaryStructure.findByPk(id as string);
    if (!structure) {
        throw new AppError(404, 'Salary structure not found');
    }

    const oldValue = { ...structure.toJSON() };

    if (name !== undefined) structure.name = name;
    if (description !== undefined) structure.description = description;
    if (components !== undefined) structure.components = components;
    if (deduction_rules !== undefined) structure.deduction_rules = deduction_rules;
    if (is_active !== undefined) structure.is_active = is_active;

    await structure.save();

    // Create audit log
    await PayrollAudit.create({
        entity_type: 'salary_structure',
        entity_id: structure.id,
        action: 'updated',
        changed_by: req.user!.id,
        changes: [{ field: 'all', old_value: oldValue, new_value: structure }],
    });

    res.json(structure);
};

// ============ PAY GROUP CONTROLLERS ============
export const getPayGroups = async (_req: AuthRequest, res: Response): Promise<void> => {
    const payGroups = await PayGroup.findAll({
        include: [
            { model: SalaryStructure, as: 'salaryStructure' },
        ],
        order: [['created_at', 'DESC']],
    });
    res.json(payGroups);
};

export const createPayGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, description, salary_structure_id, payment_frequency, payment_day, tax_regime } = req.body;

    const payGroup = await PayGroup.create({
        name,
        description,
        salary_structure_id,
        payment_frequency,
        payment_day,
        tax_regime,
        is_active: true,
    });

    await PayrollAudit.create({
        entity_type: 'pay_group',
        entity_id: payGroup.id,
        action: 'created',
        changed_by: req.user!.id,
        changes: [{ field: 'all', old_value: null, new_value: payGroup }],
    });

    res.status(201).json(payGroup);
};

export const updatePayGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body;

    const payGroup = await PayGroup.findByPk(id as string);
    if (!payGroup) {
        throw new AppError(404, 'Pay group not found');
    }

    const oldValue = { ...payGroup.toJSON() };
    await payGroup.update(updates);

    await PayrollAudit.create({
        entity_type: 'pay_group',
        entity_id: payGroup.id,
        action: 'updated',
        changed_by: req.user!.id,
        changes: [{ field: 'all', old_value: oldValue, new_value: payGroup }],
    });

    res.json(payGroup);
};

// ============ TAX SLAB CONTROLLERS ============
export const getTaxSlabs = async (req: AuthRequest, res: Response): Promise<void> => {
    const { regime, financial_year } = req.query;
    const where: any = {};

    if (regime) where.regime = regime;
    if (financial_year) where.financial_year = financial_year;

    const taxSlabs = await TaxSlab.findAll({
        where,
        order: [['financial_year', 'DESC'], ['regime', 'ASC']],
    });

    res.json(taxSlabs);
};

export const createTaxSlab = async (req: AuthRequest, res: Response): Promise<void> => {
    const { regime, financial_year, slabs, standard_deduction, cess_percentage } = req.body;

    const taxSlab = await TaxSlab.create({
        regime,
        financial_year,
        slabs,
        standard_deduction,
        cess_percentage,
        is_active: true,
    });

    res.status(201).json(taxSlab);
};

export const updateTaxSlab = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body;

    const taxSlab = await TaxSlab.findByPk(id as string);
    if (!taxSlab) {
        throw new AppError(404, 'Tax slab not found');
    }

    await taxSlab.update(updates);
    res.json(taxSlab);
};

// ============ INVESTMENT DECLARATION CONTROLLERS ============
export const getInvestmentDeclarations = async (req: AuthRequest, res: Response): Promise<void> => {
    const { employee_id, financial_year, declaration_type } = req.query;
    const where: any = {};

    // Non-HR can only see their own declarations
    if (req.user?.role !== 'hr') {
        where.employee_id = req.user?.id;
    } else if (employee_id) {
        where.employee_id = employee_id;
    }

    if (financial_year) where.financial_year = financial_year;
    if (declaration_type) where.declaration_type = declaration_type;

    const declarations = await InvestmentDeclaration.findAll({
        where,
        include: [
            { model: User, as: 'employee', attributes: ['id', 'name', 'email', 'employee_id'] },
        ],
        order: [['created_at', 'DESC']],
    });

    res.json(declarations);
};

export const createInvestmentDeclaration = async (req: AuthRequest, res: Response): Promise<void> => {
    const { financial_year, declaration_type, investments } = req.body;

    const declaration = await InvestmentDeclaration.create({
        employee_id: req.user!.id,
        financial_year,
        declaration_type,
        investments,
        status: 'draft',
    });

    res.status(201).json(declaration);
};

export const submitInvestmentDeclaration = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const declaration = await InvestmentDeclaration.findByPk(id as string);
    if (!declaration) {
        throw new AppError(404, 'Declaration not found');
    }

    if (declaration.employee_id !== req.user!.id && req.user?.role !== 'hr') {
        throw new AppError(403, 'Unauthorized');
    }

    declaration.status = 'submitted';
    declaration.submitted_at = new Date();
    await declaration.save();

    res.json(declaration);
};

export const reviewInvestmentDeclaration = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can review declarations');
    }

    const declaration = await InvestmentDeclaration.findByPk(id as string);
    if (!declaration) {
        throw new AppError(404, 'Declaration not found');
    }

    declaration.status = status;
    declaration.remarks = remarks;
    declaration.reviewed_by = req.user.id;
    declaration.reviewed_at = new Date();
    await declaration.save();

    res.json(declaration);
};

// ============ LOAN/ADVANCE CONTROLLERS ============
export const getLoanAdvances = async (req: AuthRequest, res: Response): Promise<void> => {
    const { employee_id, type, status } = req.query;
    const where: any = {};

    if (req.user?.role !== 'hr') {
        where.employee_id = req.user?.id;
    } else if (employee_id) {
        where.employee_id = employee_id;
    }

    if (type) where.type = type;
    if (status) where.status = status;

    const loanAdvances = await LoanAdvance.findAll({
        where,
        include: [
            { model: User, as: 'employee', attributes: ['id', 'name', 'email', 'employee_id'] },
        ],
        order: [['created_at', 'DESC']],
    });

    res.json(loanAdvances);
};

export const createLoanAdvance = async (req: AuthRequest, res: Response): Promise<void> => {
    const { type, amount, reason, repayment_months } = req.body;

    const loanAdvance = await LoanAdvance.create({
        employee_id: req.user!.id,
        type,
        amount,
        reason,
        repayment_months,
        monthly_deduction: repayment_months ? amount / repayment_months : 0,
        status: 'pending',
    });

    res.status(201).json(loanAdvance);
};

export const approveLoanAdvance = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { remarks } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can approve loan/advance');
    }

    const loanAdvance = await LoanAdvance.findByPk(id as string);
    if (!loanAdvance) {
        throw new AppError(404, 'Loan/Advance not found');
    }

    loanAdvance.status = 'approved';
    loanAdvance.approved_by = req.user.id;
    loanAdvance.approved_at = new Date();
    loanAdvance.remarks = remarks;
    await loanAdvance.save();

    res.json(loanAdvance);
};

export const rejectLoanAdvance = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { remarks } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can reject loan/advance');
    }

    const loanAdvance = await LoanAdvance.findByPk(id as string);
    if (!loanAdvance) {
        throw new AppError(404, 'Loan/Advance not found');
    }

    loanAdvance.status = 'rejected';
    loanAdvance.remarks = remarks;
    await loanAdvance.save();

    res.json(loanAdvance);
};

// ============ F&F SETTLEMENT CONTROLLERS ============
export const getFFSettlements = async (req: AuthRequest, res: Response): Promise<void> => {
    const { employee_id, status } = req.query;
    const where: any = {};

    if (req.user?.role !== 'hr') {
        where.employee_id = req.user?.id;
    } else if (employee_id) {
        where.employee_id = employee_id;
    }

    if (status) where.status = status;

    const settlements = await FFSettlement.findAll({
        where,
        include: [
            { model: User, as: 'employee', attributes: ['id', 'name', 'email', 'employee_id'] },
        ],
        order: [['created_at', 'DESC']],
    });

    res.json(settlements);
};

export const createFFSettlement = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can create F&F settlements');
    }

    const {
        employee_id,
        resignation_date,
        last_working_date,
        notice_period_days,
        notice_period_served,
        notice_period_recovery,
        pending_salary,
        leave_encashment,
        gratuity,
        bonus,
        other_dues,
        other_deductions,
    } = req.body;

    const total_payable =
        pending_salary +
        leave_encashment +
        gratuity +
        bonus +
        other_dues -
        notice_period_recovery -
        other_deductions;

    const settlement = await FFSettlement.create({
        employee_id,
        resignation_date,
        last_working_date,
        notice_period_days,
        notice_period_served,
        notice_period_recovery,
        pending_salary,
        leave_encashment,
        gratuity,
        bonus,
        other_dues,
        other_deductions,
        total_payable,
        status: 'pending',
    });

    res.status(201).json(settlement);
};

export const approveFFSettlement = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can approve F&F settlements');
    }

    const { id } = req.params;
    const settlement = await FFSettlement.findByPk(id as string);

    if (!settlement) {
        throw new AppError(404, 'Settlement not found');
    }

    settlement.status = 'approved';
    settlement.processed_by = req.user.id;
    settlement.processed_at = new Date();
    await settlement.save();

    res.json(settlement);
};

export const markFFSettlementPaid = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can mark F&F settlements as paid');
    }

    const { id } = req.params;
    const settlement = await FFSettlement.findByPk(id as string);

    if (!settlement) {
        throw new AppError(404, 'Settlement not found');
    }

    settlement.status = 'paid';
    settlement.paid_at = new Date();
    await settlement.save();

    res.json(settlement);
};

// ============ PAYROLL AUDIT CONTROLLERS ============
export const getPayrollAudits = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can view audit logs');
    }

    const { entity_type, entity_id, changed_by } = req.query;
    const where: any = {};

    if (entity_type) where.entity_type = entity_type;
    if (entity_id) where.entity_id = entity_id;
    if (changed_by) where.changed_by = changed_by;

    const audits = await PayrollAudit.findAll({
        where,
        include: [
            { model: User, as: 'changedBy', attributes: ['id', 'name', 'email'] },
        ],
        order: [['created_at', 'DESC']],
        limit: 100,
    });

    res.json(audits);
};

// ============ HOLD/RELEASE SALARY CONTROLLERS ============
export const holdSalary = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can hold salaries');
    }

    const { id } = req.params;
    const { remarks } = req.body;

    const slip = await SalarySlip.findByPk(id as string);
    if (!slip) {
        throw new AppError(404, 'Salary slip not found');
    }

    if (slip.status === 'paid') {
        throw new AppError(400, 'Cannot hold a paid salary');
    }

    slip.status = 'on_hold' as any;
    await slip.save();

    await PayrollAudit.create({
        entity_type: 'salary_slip',
        entity_id: slip.id,
        action: 'updated',
        changed_by: req.user.id,
        changes: [{ field: 'status', old_value: 'draft', new_value: 'on_hold' }],
        remarks,
    });

    res.json(slip);
};

export const releaseSalary = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can release salaries');
    }

    const { id } = req.params;

    const slip = await SalarySlip.findByPk(id as string);
    if (!slip) {
        throw new AppError(404, 'Salary slip not found');
    }

    slip.status = 'draft';
    await slip.save();

    await PayrollAudit.create({
        entity_type: 'salary_slip',
        entity_id: slip.id,
        action: 'updated',
        changed_by: req.user.id,
        changes: [{ field: 'status', old_value: 'on_hold', new_value: 'draft' }],
    });

    res.json(slip);
};

// ============ BANK ADVICE GENERATION ============
export const generateBankAdvice = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can generate bank advice');
    }

    const { batch_id, format } = req.body;

    const slips = await SalarySlip.findAll({
        where: { batch_id, status: 'processed' },
        include: [
            { model: User, as: 'employee', attributes: ['id', 'name', 'employee_id', 'bank_account_number', 'bank_ifsc'] },
        ],
    });

    // Generate bank advice file based on format
    const bankAdviceData = slips.map(slip => ({
        employee_id: (slip as any).employee.employee_id,
        employee_name: (slip as any).employee.name,
        account_number: (slip as any).employee.bank_account_number,
        ifsc_code: (slip as any).employee.bank_ifsc,
        amount: slip.net_salary,
    }));

    res.json({
        message: 'Bank advice generated successfully',
        format,
        data: bankAdviceData,
    });
};

// ============ TAX CALCULATION ============
export const calculateTax = async (req: AuthRequest, res: Response): Promise<void> => {
    const { employee_id, financial_year } = req.query as { employee_id?: string, financial_year?: string };

    const empId = req.user?.role === 'hr' ? employee_id : req.user?.id;

    // Get employee's salary slips for the year
    const [startYear] = financial_year!.toString().split('-');
    const slips = await SalarySlip.findAll({
        where: {
            employee_id: empId as string,
            year: { [Op.in]: [parseInt(startYear), parseInt(startYear) + 1] },
        },
    });

    // Get investment declarations
    const declarations = await InvestmentDeclaration.findAll({
        where: {
            employee_id: empId as string,
            financial_year,
            status: 'approved',
        },
    });

    // Calculate total income
    const totalIncome = slips.reduce((sum, slip) => sum + Number(slip.gross_salary), 0);

    // Calculate total deductions from investments
    const totalInvestmentDeductions = declarations.reduce((sum, dec) => {
        const inv = dec.investments;
        return sum +
            (inv.section_80c?.amount || 0) +
            (inv.section_80d?.amount || 0) +
            (inv.hra?.amount || 0) +
            (inv.home_loan?.amount || 0) +
            (inv.nps?.amount || 0);
    }, 0);

    // Get applicable tax slab
    const employee = await User.findByPk(empId as string);
    const taxSlab = await TaxSlab.findOne({
        where: {
            financial_year: financial_year as string,
            regime: (employee as any).tax_regime || 'new',
            is_active: true,
        },
    });

    let taxableIncome = totalIncome - totalInvestmentDeductions;
    if (taxSlab?.standard_deduction) {
        taxableIncome -= taxSlab.standard_deduction;
    }

    // Calculate tax based on slabs
    let calculatedTax = 0;
    if (taxSlab) {
        for (const slab of taxSlab.slabs) {
            if (taxableIncome > slab.min) {
                const taxableAmount = slab.max ? Math.min(taxableIncome - slab.min, slab.max - slab.min) : taxableIncome - slab.min;
                calculatedTax += (taxableAmount * slab.rate) / 100;
            }
        }
        // Add cess
        calculatedTax += (calculatedTax * taxSlab.cess_percentage) / 100;
    }

    res.json({
        total_income: totalIncome,
        total_deductions: totalInvestmentDeductions,
        standard_deduction: taxSlab?.standard_deduction || 0,
        taxable_income: taxableIncome,
        calculated_tax: calculatedTax,
        tax_slabs: taxSlab?.slabs || [],
    });
};
