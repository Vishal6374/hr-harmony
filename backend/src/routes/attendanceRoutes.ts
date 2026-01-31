import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as attendanceController from '../controllers/attendanceController';
import * as attendanceSettingsController from '../controllers/attendanceSettingsController';
import * as biometricController from '../controllers/BiometricController';

const router = express.Router();

// Attendance logs
router.get('/', authenticate, asyncHandler(attendanceController.getAttendanceLogs));
router.get('/summary', authenticate, asyncHandler(attendanceController.getAttendanceSummary));
router.post('/mark', authenticate, auditLog('attendance', 'mark'), asyncHandler(attendanceController.markAttendance));
router.put('/update/:id', authenticate, requireHR, auditLog('attendance', 'update'), asyncHandler(attendanceController.updateAttendance));
router.post('/lock', authenticate, requireHR, auditLog('attendance', 'lock'), asyncHandler(attendanceController.lockAttendance));

// Attendance settings
router.get('/settings', authenticate, asyncHandler(attendanceSettingsController.getAttendanceSettings));
router.put('/settings', authenticate, requireHR, auditLog('attendance_settings', 'update'), asyncHandler(attendanceSettingsController.updateAttendanceSettings));

// Biometric Sync Service
router.put('/config', authenticate, requireHR, auditLog('attendance', 'update_config'), asyncHandler(biometricController.updateConfig));
router.post('/validate', authenticate, requireHR, asyncHandler(biometricController.validateSystem));
router.post('/sync', authenticate, requireHR, asyncHandler(biometricController.triggerSync));
router.get('/sync/status', authenticate, requireHR, asyncHandler(biometricController.getSyncStatus));

export default router;

