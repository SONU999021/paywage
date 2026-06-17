/**
 * Vercel serverless proxy — forwards /api/* to the Railway backend.
 * POST/PUT/PATCH/DELETE work here; SPA rewrites alone return 405 for POST.
 */
const BACKEND =
  process.env.RAILWAY_API_URL ||
  process.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  'https://backend-production-fa482.up.railway.app';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function buildTargetUrl(req) {
  const segments = req.query.path;
  const apiPath = Array.isArray(segments) ? segments.join('/') : segments || '';
  const search = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return `${BACKEND.replace(/\/$/, '')}/api/${apiPath}${search}`;
}

function forwardHeaders(req) {
  const headers = {};
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  if (req.headers.accept) {
    headers.Accept = req.headers.accept;
  }
  return headers;
}

export default async function handler(req, res) {
  const target = buildTargetUrl(req);
  const method = req.method || 'GET';

  const init = {
    method,
    headers: forwardHeaders(req),
  };

  if (method !== 'GET' && method !== 'HEAD' && req.body !== undefined) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const response = await fetch(target, init);
    const body = await response.text();

    res.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.send(body);
  } catch (error) {
    console.error('[api proxy]', method, target, error);
    res.status(502).json({
      error: 'Unable to reach the backend API. Check Railway deployment.',
    });
  }
}
