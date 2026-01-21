import express from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as authController from '../controllers/authController';

const router = express.Router();

router.post('/login', asyncHandler(authController.login));
router.get('/profile', authenticate, asyncHandler(authController.getProfile));
router.put('/profile', authenticate, asyncHandler(authController.updateProfile));
router.post('/change-password', authenticate, asyncHandler(authController.changePassword));

export default router;
