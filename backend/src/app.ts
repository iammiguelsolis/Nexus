import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/session.routes';
import okrRoutes from './routes/okr.routes';
import vacancyRoutes from './routes/vacancy.routes';
import profileRoutes from './routes/profile.routes';

const app = express();

// ============================================================
// Global Middleware
// ============================================================
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// Health Check
// ============================================================
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'nexus-api' });
});

// ============================================================
// Routes
// ============================================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', sessionRoutes);
app.use('/api/v1', okrRoutes);
app.use('/api/v1/vacancies', vacancyRoutes);
app.use('/api/v1', profileRoutes);

// ============================================================
// 404 Handler
// ============================================================
app.use((_req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado', code: 'NOT_FOUND' });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use(errorMiddleware);

export default app;
