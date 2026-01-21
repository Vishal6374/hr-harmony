import express from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as dashboardController from '../controllers/dashboardController';

const router = express.Router();

router.get('/stats', authenticate, asyncHandler(dashboardController.getDashboardStats));

export default router;
