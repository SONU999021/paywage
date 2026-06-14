import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as leaveService from '../services/leave.service.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/types', async (req: AuthRequest, res, next) => {
  try {
    const types = await leaveService.listLeaveTypes(req.user!.companyId!);
    res.json(types);
  } catch (err) {
    next(err);
  }
});

router.post('/types', async (req: AuthRequest, res, next) => {
  try {
    const data = leaveService.leaveTypeSchema.parse(req.body);
    const type = await leaveService.createLeaveType(req.user!.companyId!, data);
    res.status(201).json(type);
  } catch (err) {
    next(err);
  }
});

router.get('/requests', async (req: AuthRequest, res, next) => {
  try {
    const requests = await leaveService.listLeaveRequests(req.user!.companyId!, {
      status: req.query.status as string,
      employeeId: req.query.employeeId as string,
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.post('/requests', async (req: AuthRequest, res, next) => {
  try {
    const data = leaveService.leaveRequestSchema.parse(req.body);
    const request = await leaveService.applyLeave(req.user!.companyId!, data);
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

router.post('/requests/:id/approve', async (req: AuthRequest, res, next) => {
  try {
    const result = await leaveService.approveLeave(
      req.user!.companyId!,
      req.params.id,
      req.user!.userId,
      req.user!.role,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/requests/:id/reject', async (req: AuthRequest, res, next) => {
  try {
    const result = await leaveService.rejectLeave(req.user!.companyId!, req.params.id, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
