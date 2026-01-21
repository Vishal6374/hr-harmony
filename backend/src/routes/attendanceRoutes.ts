import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as attendanceController from '../controllers/attendanceController';

const router = express.Router();

router.get('/', authenticate, asyncHandler(attendanceController.getAttendanceLogs));
router.get('/summary', authenticate, asyncHandler(attendanceController.getAttendanceSummary));
router.post('/mark', authenticate, auditLog('attendance', 'mark'), asyncHandler(attendanceController.markAttendance));
router.post('/lock', authenticate, requireHR, auditLog('attendance', 'lock'), asyncHandler(attendanceController.lockAttendance));

export default router;
