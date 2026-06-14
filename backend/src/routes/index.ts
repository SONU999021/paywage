import { Router } from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import employeeRoutes from './employee.routes.js';
import attendanceRoutes from './attendance.routes.js';
import leaveRoutes from './leave.routes.js';
import payrollRoutes from './payroll.routes.js';
import salarySlipRoutes from './salarySlip.routes.js';
import reportRoutes from './report.routes.js';
import companyRoutes from './company.routes.js';
import userRoutes from './user.routes.js';
import importRoutes from './import.routes.js';
import auditRoutes from './audit.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/salary-slips', salarySlipRoutes);
router.use('/reports', reportRoutes);
router.use('/company', companyRoutes);
router.use('/users', userRoutes);
router.use('/import', importRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/notifications', notificationRoutes);

export default router;
