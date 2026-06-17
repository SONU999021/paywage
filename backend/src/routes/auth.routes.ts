import { Router } from 'express';
import { ZodError } from 'zod';
import * as authService from '../services/auth.service.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new company
 */
router.post('/register', async (req, res, next) => {
  try {
    const data = authService.registerSchema.parse(req.body);
    const result = await authService.registerCompany(data);
    console.info('[auth/register] success', { email: data.email, companyId: result.companyId });
    res.status(201).json(result);
  } catch (err) {
    if (!(err instanceof ZodError)) {
      console.error('[auth/register] failed', err);
    }
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 */
router.post('/login', async (req, res, next) => {
  try {
    const data = authService.loginSchema.parse(req.body);
    const result = await authService.loginUser(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError(400, 'Refresh token required');
    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
