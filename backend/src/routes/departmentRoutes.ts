import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as departmentController from '../controllers/departmentController';

const router = express.Router();

router.get('/', authenticate, asyncHandler(departmentController.getAllDepartments));
router.get('/:id', authenticate, asyncHandler(departmentController.getDepartmentById));
router.post('/', authenticate, requireHR, auditLog('departments', 'create'), asyncHandler(departmentController.createDepartment));
router.put('/:id', authenticate, requireHR, auditLog('departments', 'update'), asyncHandler(departmentController.updateDepartment));
router.delete('/:id', authenticate, requireHR, auditLog('departments', 'delete'), asyncHandler(departmentController.deleteDepartment));

export default router;
