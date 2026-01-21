import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as configController from '../controllers/payrollConfigController';

const router = express.Router();

// ============ SALARY STRUCTURE ROUTES ============
router.get('/salary-structures', authenticate, requireHR, asyncHandler(configController.getSalaryStructures));
router.post('/salary-structures', authenticate, requireHR, auditLog('salary_structure', 'create'), asyncHandler(configController.createSalaryStructure));
router.put('/salary-structures/:id', authenticate, requireHR, auditLog('salary_structure', 'update'), asyncHandler(configController.updateSalaryStructure));

// ============ PAY GROUP ROUTES ============
router.get('/pay-groups', authenticate, requireHR, asyncHandler(configController.getPayGroups));
router.post('/pay-groups', authenticate, requireHR, auditLog('pay_group', 'create'), asyncHandler(configController.createPayGroup));
router.put('/pay-groups/:id', authenticate, requireHR, auditLog('pay_group', 'update'), asyncHandler(configController.updatePayGroup));

// ============ TAX SLAB ROUTES ============
router.get('/tax-slabs', authenticate, requireHR, asyncHandler(configController.getTaxSlabs));
router.post('/tax-slabs', authenticate, requireHR, auditLog('tax_slab', 'create'), asyncHandler(configController.createTaxSlab));
router.put('/tax-slabs/:id', authenticate, requireHR, auditLog('tax_slab', 'update'), asyncHandler(configController.updateTaxSlab));

// ============ INVESTMENT DECLARATION ROUTES ============
router.get('/investment-declarations', authenticate, asyncHandler(configController.getInvestmentDeclarations));
router.post('/investment-declarations', authenticate, asyncHandler(configController.createInvestmentDeclaration));
router.post('/investment-declarations/:id/submit', authenticate, asyncHandler(configController.submitInvestmentDeclaration));
router.post('/investment-declarations/:id/review', authenticate, requireHR, asyncHandler(configController.reviewInvestmentDeclaration));

// ============ LOAN/ADVANCE ROUTES ============
router.get('/loan-advances', authenticate, asyncHandler(configController.getLoanAdvances));
router.post('/loan-advances', authenticate, asyncHandler(configController.createLoanAdvance));
router.post('/loan-advances/:id/approve', authenticate, requireHR, asyncHandler(configController.approveLoanAdvance));
router.post('/loan-advances/:id/reject', authenticate, requireHR, asyncHandler(configController.rejectLoanAdvance));

// ============ F&F SETTLEMENT ROUTES ============
router.get('/ff-settlements', authenticate, asyncHandler(configController.getFFSettlements));
router.post('/ff-settlements', authenticate, requireHR, auditLog('ff_settlement', 'create'), asyncHandler(configController.createFFSettlement));
router.post('/ff-settlements/:id/approve', authenticate, requireHR, asyncHandler(configController.approveFFSettlement));
router.post('/ff-settlements/:id/mark-paid', authenticate, requireHR, asyncHandler(configController.markFFSettlementPaid));

// ============ AUDIT TRAIL ROUTES ============
router.get('/audit-trail', authenticate, requireHR, asyncHandler(configController.getPayrollAudits));

// ============ HOLD/RELEASE SALARY ROUTES ============
router.post('/hold-salary/:id', authenticate, requireHR, asyncHandler(configController.holdSalary));
router.post('/release-salary/:id', authenticate, requireHR, asyncHandler(configController.releaseSalary));

// ============ BANK ADVICE ROUTES ============
router.post('/bank-advice', authenticate, requireHR, asyncHandler(configController.generateBankAdvice));

// ============ TAX CALCULATION ROUTES ============
router.get('/calculate-tax', authenticate, asyncHandler(configController.calculateTax));

export default router;
