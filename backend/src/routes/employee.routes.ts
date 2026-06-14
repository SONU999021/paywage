import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as employeeService from '../services/employee.service.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user!.companyId!;
    const result = await employeeService.listEmployees(companyId, {
      search: req.query.search as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      departmentId: req.query.departmentId as string,
      status: req.query.status as string,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const employee = await employeeService.getEmployee(req.user!.companyId!, req.params.id);
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize('COMPANY_ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const data = employeeService.employeeSchema.parse(req.body);
    const employee = await employeeService.createEmployee(req.user!.companyId!, data);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authorize('COMPANY_ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const data = employeeService.employeeSchema.partial().parse(req.body);
    const employee = await employeeService.updateEmployee(req.user!.companyId!, req.params.id, data);
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('COMPANY_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const result = await employeeService.deleteEmployee(req.user!.companyId!, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
