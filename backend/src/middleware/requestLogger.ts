import type { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const body =
    req.method !== 'GET' && req.method !== 'HEAD' && Object.keys(req.body ?? {}).length > 0
      ? { ...req.body, password: req.body?.password ? '[redacted]' : undefined }
      : undefined;

  console.info(`[${req.method}] ${req.originalUrl}`, {
    origin: req.headers.origin,
    ...(body ? { body } : {}),
  });
  next();
}
