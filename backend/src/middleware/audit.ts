import type { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import type { AuthRequest } from './auth.js';

export function auditLog(module: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        void prisma.auditLog.create({
          data: {
            companyId: req.user?.companyId ?? null,
            userId: req.user?.userId ?? null,
            action,
            module,
            entityId: (req.params as { id?: string }).id ?? null,
            oldValue: req.method === 'PUT' || req.method === 'PATCH' ? undefined : undefined,
            newValue: req.body as object,
            ipAddress: req.ip || req.socket.remoteAddress || null,
          },
        });
      }
      return originalJson(body);
    };

    next();
  };
}
