import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required — link PostgreSQL in Railway'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  RAILWAY_PUBLIC_DOMAIN: z.string().optional(),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('\n========================================');
    console.error('  BACKEND CANNOT START');
    console.error('========================================\n');
    for (const issue of result.error.issues) {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error('\n  Fix in Railway → backend service → Variables:\n');
    console.error('  DATABASE_URL  = ${{Postgres.DATABASE_URL}}  (reference linked DB)');
    console.error('  JWT_SECRET    = any random string 32+ chars');
    console.error('  JWT_REFRESH_SECRET = another random string 32+ chars');
    console.error('  NODE_ENV      = production\n');
    process.exit(1);
  }
  return result.data;
}

const parsed = loadEnv();

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
