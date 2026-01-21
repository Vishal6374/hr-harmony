import express from 'express';
import { authenticate, requireHR } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { auditLog } from '../middleware/auditLog';
import * as designationController from '../controllers/designationController';

const router = express.Router();

router.get('/', authenticate, asyncHandler(designationController.getAllDesignations));
router.get('/:id', authenticate, asyncHandler(designationController.getDesignationById));
router.post('/', authenticate, requireHR, auditLog('designations', 'create'), asyncHandler(designationController.createDesignation));
router.put('/:id', authenticate, requireHR, auditLog('designations', 'update'), asyncHandler(designationController.updateDesignation));
router.delete('/:id', authenticate, requireHR, auditLog('designations', 'delete'), asyncHandler(designationController.deleteDesignation));

export default router;
