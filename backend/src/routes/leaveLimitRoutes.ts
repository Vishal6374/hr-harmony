import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as leaveLimitController from '../controllers/leaveLimitController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get leave limits
router.get('/', asyncHandler(leaveLimitController.getLeaveLimits));

// Update leave limits (HR only)
router.put('/', asyncHandler(leaveLimitController.updateLeaveLimits));

export default router;
