/**
 * Vercel serverless proxy (CommonJS — isolated from package "type":"module").
 * Forwards /api/* to Railway. Set RAILWAY_API_URL in Vercel env vars.
 */
function resolveBackend() {
  const railway = process.env.RAILWAY_API_URL?.trim();
  if (railway) {
    return railway.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  const vite = process.env.VITE_API_URL?.trim();
  if (vite) {
    return vite.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  // Default — user's Railway backend domain
  return 'https://backend-production-fa482.up.railway.app';
}

function buildTargetUrl(req, backend) {
  const segments = req.query.path;
  const apiPath = Array.isArray(segments) ? segments.join('/') : segments || '';
  const search = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return `${backend}/api/${apiPath}${search}`;
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

async function handler(req, res) {
  const backend = resolveBackend();
  const target = buildTargetUrl(req, backend);
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
      error: `Cannot reach Railway backend at ${backend}. Check that the backend service is running and RAILWAY_API_URL is correct.`,
    });
  }
}

handler.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

module.exports = handler;
