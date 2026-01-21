import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as payrollController from '../controllers/payrollController';

const router = express.Router();

router.get('/batches', authenticate, requireHR, asyncHandler(payrollController.getPayrollBatches));
router.get('/slips', authenticate, asyncHandler(payrollController.getSalarySlips));
router.post('/generate', authenticate, requireHR, auditLog('payroll', 'generate'), asyncHandler(payrollController.generatePayroll));
router.post('/mark-paid/:id', authenticate, requireHR, auditLog('payroll', 'mark_paid'), asyncHandler(payrollController.markPayrollPaid));

router.get('/stats', authenticate, requireHR, asyncHandler(payrollController.getPayrollStats));
router.post('/create', authenticate, requireHR, auditLog('payroll', 'create'), asyncHandler(payrollController.createSalarySlip));
router.put('/update/:id', authenticate, requireHR, auditLog('payroll', 'update'), asyncHandler(payrollController.updateSalarySlip));

export default router;
