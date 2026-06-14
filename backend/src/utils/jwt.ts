import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'HR_MANAGER'
  | 'PAYROLL_MANAGER'
  | 'REPORTING_MANAGER'
  | 'EMPLOYEE';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string | null;
}

export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function signRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
