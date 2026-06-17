/**
 * Railway production entrypoint.
 * 1. Validate DATABASE_URL
 * 2. Run migrations (sync)
 * 3. Start API server (same process — avoids npm SIGTERM wrapper issues)
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('========================================');
console.log('  PayWager API — starting');
console.log('========================================');
console.log('  PORT:', process.env.PORT || '5000');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '(set)' : 'MISSING');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '(set)' : 'MISSING');

if (!process.env.DATABASE_URL) {
  console.error('\nFATAL: DATABASE_URL is not set.');
  console.error('Railway → backend → Variables → Add Reference → PostgreSQL → DATABASE_URL\n');
  process.exit(1);
}

try {
  console.log('\n[start] Running database migrations...');
  execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  console.log('[start] Migrations complete.\n');
} catch {
  console.error('\nFATAL: Database migration failed. Check DATABASE_URL and PostgreSQL is running.\n');
  process.exit(1);
}

// Start server in this process (env validation happens on import)
await import(path.join(root, 'dist/index.js'));
