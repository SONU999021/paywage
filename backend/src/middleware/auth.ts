import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import type { UserRole } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export async function requireCompanyAccess(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user?.companyId) {
    res.status(403).json({ error: 'Company access required' });
    return;
  }

  const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
  if (companyId && companyId !== req.user.companyId && req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Access denied to this company' });
    return;
  }

  next();
}
