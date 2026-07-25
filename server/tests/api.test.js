import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('API endpoints', () => {
  test('GET /api/health reports degraded when DB is not connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.db).toBe('disconnected');
  });

  test('GET /metrics exposes request count and duration metrics', async () => {
    await request(app).get('/api/health');
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });

  test('POST /api/subjects rejects invalid payload before touching DB', async () => {
    const res = await request(app).post('/api/subjects').send({ name: '', credits: 99, grade: 42 });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('GET /api/subjects/:id rejects a malformed id', async () => {
    const res = await request(app).get('/api/subjects/not-an-object-id');
    expect(res.status).toBe(400);
  });

  test('unknown route returns 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
