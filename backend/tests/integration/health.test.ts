import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Health, Readiness & Security Probes', () => {
  it('GET /health should return 200 with service metadata', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.service).toBe('servora-backend');
    expect(res.body.data.uptimeSeconds).toBeDefined();
    expect(res.body.data.timestamp).toBeDefined();
  });

  it('GET /api/v1/health should also return 200', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /ready should return a structured status without leaking database credentials', async () => {
    const res = await request(app).get('/ready');

    // Either 200 (if local PG is available) or 503 (if disconnected)
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('database');

    // Must never leak connection strings or passwords in response
    const rawResponse = JSON.stringify(res.body);
    expect(rawResponse).not.toContain('postgresql://');
    expect(rawResponse).not.toContain('password');
  }, 30000);

  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOTFOUND');
  });

  it('should include Helmet HTTP security headers (SEC-009)', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
