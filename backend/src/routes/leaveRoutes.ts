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
router.post('/manager/approve/:id', authenticate, auditLog('leaves', 'manager_approve'), asyncHandler(leaveController.managerApproveLeave));
router.post('/manager/reject/:id', authenticate, auditLog('leaves', 'manager_reject'), asyncHandler(leaveController.managerRejectLeave));
router.post('/cancel/:id', authenticate, auditLog('leaves', 'cancel'), asyncHandler(leaveController.cancelLeave));
router.put('/:id', authenticate, auditLog('leaves', 'update'), asyncHandler(leaveController.updateLeave));
router.delete('/:id', authenticate, auditLog('leaves', 'delete'), asyncHandler(leaveController.deleteLeave));

export default router;
