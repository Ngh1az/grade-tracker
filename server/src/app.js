import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import subjectsRouter from './routes/subjects.js';
import authRouter from './routes/auth.js';
import requireAuth from './middleware/requireAuth.js';
import requireLevel from './middleware/requireLevel.js';
import { metricsMiddleware, register } from './metrics.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(metricsMiddleware);

  app.get('/api/health', (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
      status: connected ? 'ok' : 'degraded',
      db: connected ? 'connected' : 'disconnected',
      uptime: Math.round(process.uptime()),
    });
  });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.use('/api/auth', authRouter);
  app.use('/api/subjects', requireAuth, requireLevel, subjectsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
