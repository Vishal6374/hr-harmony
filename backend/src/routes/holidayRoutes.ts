import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as holidayController from '../controllers/holidayController';

const router = express.Router();

router.get('/', authenticate, asyncHandler(holidayController.getHolidays));
router.get('/:id', authenticate, asyncHandler(holidayController.getHolidayById));
router.post('/', authenticate, requireHR, auditLog('holidays', 'create'), asyncHandler(holidayController.createHoliday));
router.put('/:id', authenticate, requireHR, auditLog('holidays', 'update'), asyncHandler(holidayController.updateHoliday));
router.delete('/:id', authenticate, requireHR, auditLog('holidays', 'delete'), asyncHandler(holidayController.deleteHoliday));

export default router;
