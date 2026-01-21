import express from 'express';
import { authenticate, requireHR, requireSelfOrHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as employeeController from '../controllers/employeeController';

const router = express.Router();

router.get('/', authenticate, requireHR, asyncHandler(employeeController.getAllEmployees));
router.get('/:id', authenticate, requireSelfOrHR('id'), asyncHandler(employeeController.getEmployeeById));
router.post('/', authenticate, requireHR, auditLog('employees', 'create'), asyncHandler(employeeController.createEmployee));
router.put('/:id', authenticate, requireSelfOrHR('id'), auditLog('employees', 'update'), asyncHandler(employeeController.updateEmployee));
router.delete('/:id', authenticate, requireHR, auditLog('employees', 'delete'), asyncHandler(employeeController.deleteEmployee));

export default router;
