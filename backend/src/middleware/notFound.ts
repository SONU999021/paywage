import type { Request, Response } from 'express';

export function apiNotFound(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    method: req.method,
    path: req.originalUrl,
  });
}
