import { Router } from 'express';
import * as resignationController from '../controllers/resignationController';
import { authenticate, requireHR } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Employee & HR routes
router.get('/', resignationController.getResignations);
router.post('/apply', resignationController.applyResignation);
router.post('/:id/withdraw', resignationController.withdrawResignation);

// HR Only routes
router.post('/:id/approve', requireHR, resignationController.approveResignation);
router.post('/:id/reject', requireHR, resignationController.rejectResignation);

export default router;
