/**
 * Railway production start: validate env → migrate DB → start API server.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(command, args, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n[start] ${label}...`);
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

async function main() {
  console.log('========================================');
  console.log('  PayWager API — production startup');
  console.log('========================================');
  console.log('  PORT:', process.env.PORT || '5000');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '(set)' : 'MISSING');

  if (!process.env.DATABASE_URL) {
    console.error('\nERROR: DATABASE_URL is not set.');
    console.error('In Railway: link PostgreSQL → Variables → Add Reference → DATABASE_URL\n');
    process.exit(1);
  }

  try {
    await run('npx', ['prisma', 'migrate', 'deploy', '--schema=./prisma/schema.prisma'], 'Database migrations');
    await run('node', ['dist/index.js'], 'API server');
  } catch (error) {
    console.error('\n[start] Startup failed:', error.message);
    process.exit(1);
  }
}

main();
