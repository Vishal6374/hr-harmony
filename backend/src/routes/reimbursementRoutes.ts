import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as reimbursementController from '../controllers/reimbursementController';

const router = express.Router();

router.get('/', authenticate, asyncHandler(reimbursementController.getReimbursements));
router.post('/submit', authenticate, auditLog('reimbursements', 'submit'), asyncHandler(reimbursementController.submitReimbursement));
router.post('/approve/:id', authenticate, requireHR, auditLog('reimbursements', 'approve'), asyncHandler(reimbursementController.approveReimbursement));
router.post('/reject/:id', authenticate, requireHR, auditLog('reimbursements', 'reject'), asyncHandler(reimbursementController.rejectReimbursement));

export default router;
