import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { resolveUser } from './middleware/resolveUser';
import { errorHandler } from './middleware/errorHandler';
import usersRouter from './routes/users';
import documentsRouter from './routes/documents';
import sharesRouter from './routes/shares';
import uploadRouter from './routes/upload';
import { supabase } from './lib/supabase';

dotenv.config();

export function createApp() {
  const app = express();

  // CORS configuration
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000' || 'https://ajaia-frontend.vercel.app';
  app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-User-Email'],
    credentials: true
  }));

  app.use(express.json());

  // Health check endpoints
  app.get(['/health', '/api/v1/health'], async (req, res) => {
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
      });
    } catch (err: any) {
      return res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'error',
        message: err.message || String(err)
      });
    }
  });

  // Unauthenticated routes
  app.use('/api/v1/users', usersRouter);

  // Authenticated routes
  app.use(resolveUser);

  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1/shares', sharesRouter);
  app.use('/api/v1/upload', uploadRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
