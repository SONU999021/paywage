import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, 'dist');
const port = Number(process.env.PORT) || 8080;
const host = '0.0.0.0';
const backendOrigin = (() => {
  const railway = process.env.RAILWAY_API_URL?.trim();
  if (railway) return railway.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const vite = process.env.VITE_API_URL?.trim();
  if (vite) return vite.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return null;
})();

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function proxyApi(req, res, rawUrl) {
  if (!backendOrigin) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Set RAILWAY_API_URL or VITE_API_URL to your backend URL.' }));
    return;
  }

  const [pathname, search = ''] = (rawUrl || '').split('?');
  const apiPath = pathname.replace(/^\/api\/?/, '');
  const target = `${backendOrigin.replace(/\/$/, '')}/api/${apiPath}${search ? `?${search}` : ''}`;

  const headers = {};
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;

  try {
    const body =
      req.method !== 'GET' && req.method !== 'HEAD' ? await readBody(req) : undefined;
    const response = await fetch(target, { method: req.method, headers, body });
    const text = await response.text();
    res.writeHead(response.status, {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    });
    res.end(text);
  } catch (error) {
    log('API proxy error:', error);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unable to reach backend API' }));
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function log(...args) {
  console.log('[paywage-web]', ...args);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'paywage-web' }));
    return;
  }

  if (urlPath.startsWith('/api/') || urlPath === '/api') {
    void proxyApi(req, res, req.url);
    return;
  }

  const safePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = path.resolve(distDir, safePath);

  if (!filePath.startsWith(distDir + path.sep) && filePath !== path.join(distDir, 'index.html')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }

  sendFile(res, path.join(distDir, 'index.html'));
});

if (!fs.existsSync(distDir)) {
  log('ERROR: dist/ folder missing at', distDir);
  log('cwd:', process.cwd());
  log('files:', fs.readdirSync(__dirname));
  process.exit(1);
}

server.on('error', (err) => {
  log('Server error:', err);
  process.exit(1);
});

server.listen(port, host, () => {
  log(`PayWager frontend listening on http://${host}:${port}`);
  log('dist:', distDir);
});
