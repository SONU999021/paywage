import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('API routes', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/health returns running', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('running');
  });

  it('OPTIONS /api/auth/login is allowed for CORS preflight', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://paywager.vercel.app')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-methods']).toMatch(/POST/);
  });

  it('POST /api/auth/register rejects empty body with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/auth/register returns 404 not 405', async () => {
    const res = await request(app).get('/api/auth/register');
    expect(res.status).toBe(404);
  });

  it('unknown API route returns 404 JSON', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
