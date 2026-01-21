import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as leaveController from '../controllers/leaveController';

const router = express.Router();

router.get('/requests', authenticate, asyncHandler(leaveController.getLeaveRequests));
router.get('/balances', authenticate, asyncHandler(leaveController.getLeaveBalances));
router.post('/apply', authenticate, auditLog('leaves', 'apply'), asyncHandler(leaveController.applyLeave));
router.post('/approve/:id', authenticate, requireHR, auditLog('leaves', 'approve'), asyncHandler(leaveController.approveLeave));
router.post('/reject/:id', authenticate, requireHR, auditLog('leaves', 'reject'), asyncHandler(leaveController.rejectLeave));
router.post('/cancel/:id', authenticate, auditLog('leaves', 'cancel'), asyncHandler(leaveController.cancelLeave));

export default router;
