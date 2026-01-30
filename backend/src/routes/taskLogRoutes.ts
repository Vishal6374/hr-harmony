import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as taskLogController from '../controllers/taskLogController';

const router = express.Router();

router.post('/', authenticate, asyncHandler(taskLogController.logTask));
router.get('/my', authenticate, asyncHandler(taskLogController.getMyTasks));
router.get('/all', authenticate, requireHR, asyncHandler(taskLogController.getAllTasks));
router.put('/:id', authenticate, asyncHandler(taskLogController.updateTask));
router.delete('/:id', authenticate, asyncHandler(taskLogController.deleteTask));

export default router;
