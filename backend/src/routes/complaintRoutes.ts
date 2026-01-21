import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as complaintController from '../controllers/complaintController';

const router = express.Router();

router.get('/', authenticate, asyncHandler(complaintController.getComplaints));
router.post('/submit', authenticate, auditLog('complaints', 'submit'), asyncHandler(complaintController.submitComplaint));
router.post('/respond/:id', authenticate, requireHR, auditLog('complaints', 'respond'), asyncHandler(complaintController.respondToComplaint));
router.post('/close/:id', authenticate, requireHR, auditLog('complaints', 'close'), asyncHandler(complaintController.closeComplaint));

export default router;
