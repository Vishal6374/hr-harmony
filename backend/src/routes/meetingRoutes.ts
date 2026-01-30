import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as meetingController from '../controllers/meetingController';

const router = express.Router();

router.post('/', authenticate, requireHR, auditLog('meeting', 'create'), asyncHandler(meetingController.createMeeting));
router.get('/my', authenticate, asyncHandler(meetingController.getMyMeetings));
router.get('/all', authenticate, requireHR, asyncHandler(meetingController.getAllMeetings));
router.put('/:id', authenticate, auditLog('meeting', 'update'), asyncHandler(meetingController.updateMeeting));
router.delete('/:id', authenticate, auditLog('meeting', 'delete'), asyncHandler(meetingController.deleteMeeting));

export default router;
