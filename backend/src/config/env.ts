import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  RAILWAY_PUBLIC_DOMAIN: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  apiPublicUrl: parsed.RAILWAY_PUBLIC_DOMAIN
    ? `https://${parsed.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${parsed.PORT}`,
};

export const PRODUCTION_FRONTEND_URLS = [
  'https://frontend-production-e9ac.up.railway.app',
  'https://paywage-frontend.up.railway.app',
];

export function getAllowedOrigins(): string[] {
  const fromEnv = parsed.FRONTEND_URL.split(',').map((url) => url.trim()).filter(Boolean);
  const defaults = ['http://localhost:5173', ...PRODUCTION_FRONTEND_URLS];
  return [...new Set([...defaults, ...fromEnv])];
}
