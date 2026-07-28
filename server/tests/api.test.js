import request from 'supertest';
import { createApp } from '../src/app.js';
import { signToken } from '../src/auth.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

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

  test('unknown route returns 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});

describe('subject routes are protected', () => {
  test('GET /api/subjects without a token is rejected', async () => {
    const res = await request(app).get('/api/subjects');
    expect(res.status).toBe(401);
  });

  test('POST /api/subjects without a token is rejected before validation', async () => {
    const res = await request(app).post('/api/subjects').send({ name: '', grade: 42 });
    expect(res.status).toBe(401);
  });

  test('a malformed token is rejected', async () => {
    const res = await request(app)
      .get('/api/subjects')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  test('a token signed with a different secret is rejected', async () => {
    const realSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'someone-elses-secret';
    const foreignToken = signToken('64b7f0c8e1a2b3c4d5e6f701');
    process.env.JWT_SECRET = realSecret;

    const res = await request(app)
      .get('/api/subjects')
      .set('Authorization', `Bearer ${foreignToken}`);
    expect(res.status).toBe(401);
  });
});

describe('auth validation', () => {
  test('register rejects a malformed email before touching the DB', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('email không hợp lệ');
  });

  test('register rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'sv@example.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('mật khẩu tối thiểu 6 ký tự');
  });

  test('login rejects a request with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
