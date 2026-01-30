import express from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import employeeRoutes from './employeeRoutes';
import employeeDocumentRoutes from './employeeDocumentRoutes';
import departmentRoutes from './departmentRoutes';
import designationRoutes from './designationRoutes';
import attendanceRoutes from './attendanceRoutes';
import leaveRoutes from './leaveRoutes';
import leaveLimitRoutes from './leaveLimitRoutes';
import payrollRoutes from './payrollRoutesSimplified';
import payrollConfigRoutes from './payrollConfigRoutes';
import reimbursementRoutes from './reimbursementRoutes';
import complaintRoutes from './complaintRoutes';
import policyRoutes from './policyRoutes';
import holidayRoutes from './holidayRoutes';
import resignationRoutes from './resignationRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/employees', employeeRoutes);
router.use('/employees', employeeDocumentRoutes);
router.use('/departments', departmentRoutes);
router.use('/designations', designationRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/leave-limits', leaveLimitRoutes);
router.use('/payroll', payrollRoutes);
router.use('/payroll-config', payrollConfigRoutes);
router.use('/reimbursements', reimbursementRoutes);
router.use('/complaints', complaintRoutes);
router.use('/policies', policyRoutes);
router.use('/holidays', holidayRoutes);
router.use('/resignations', resignationRoutes);

// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
