import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const port = process.env.PORT || '3000';

let serveBin;
try {
  serveBin = require.resolve('serve/build/main.js');
} catch {
  console.error('Error: "serve" package not found. Run npm install.');
  process.exit(1);
}

console.log(`Starting PayWage frontend on port ${port}`);

const child = spawn(process.execPath, [serveBin, 'dist', '-s', '-l', port], {
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 1));
