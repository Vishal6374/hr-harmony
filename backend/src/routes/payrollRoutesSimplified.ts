import { Router } from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as payrollController from '../controllers/payrollControllerSimplified';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get payroll batches (HR only)
router.get('/batches', requireHR, asyncHandler(payrollController.getPayrollBatches));

// Get salary slips (HR sees all, employees see own)
router.get('/slips', asyncHandler(payrollController.getSalarySlips));

// Preview payroll before processing (HR only)
router.post('/preview', requireHR, asyncHandler(payrollController.previewPayroll));

// Process payroll (HR only)
router.post('/process', requireHR, asyncHandler(payrollController.processPayroll));

// Mark payroll as paid (HR only)
router.post('/batches/:id/mark-paid', requireHR, asyncHandler(payrollController.markPayrollPaid));

export default router;
