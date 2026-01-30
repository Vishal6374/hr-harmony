import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as regularizationController from '../controllers/regularizationController';

const router = express.Router();

router.post('/request', authenticate, auditLog('regularization', 'request'), asyncHandler(regularizationController.requestRegularization));
router.get('/my', authenticate, asyncHandler(regularizationController.getMyRequests));
router.get('/all', authenticate, requireHR, asyncHandler(regularizationController.getAllRequests));
router.put('/process/:id', authenticate, requireHR, auditLog('regularization', 'process'), asyncHandler(regularizationController.processRequest));

export default router;
