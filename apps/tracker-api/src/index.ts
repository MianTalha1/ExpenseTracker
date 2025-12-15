/**
 * Casha Tracker API (Firebase Version)
 * Minimal Express.js server for AI features only
 * Data storage handled by Firestore on the frontend
 */

import 'dotenv/config';
import { env } from './config/env';
import express from 'express';
import cors from 'cors';

// Import middleware
import { requestLoggerWithSkip } from './middleware/logging.middleware';
import { apiRateLimit } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes (AI features only)
import insightsRoutes from './routes/insights.routes';
import chatRoutes from './routes/chat.routes';

const app = express();

// ============================================================================
// Core Middleware
// ============================================================================

// CORS configuration - allow multiple localhost ports in development
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Request logging (skip health check)
app.use(requestLoggerWithSkip(['/health']));

// ============================================================================
// Health Check (before rate limiting)
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: 'firebase',
  });
});

// ============================================================================
// API Routes (with rate limiting)
// ============================================================================

// Apply global rate limit to API routes
app.use('/api', apiRateLimit);

// Mount AI-powered routes only
app.use('/api/insights', insightsRoutes);
app.use('/api/chat', chatRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler (for unmatched routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// Start Server
// ============================================================================

app.listen(env.API_PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log('  Casha Tracker API (Firebase Version)');
  console.log('===========================================');
  console.log(`  Server:      http://localhost:${env.API_PORT}`);
  console.log(`  Health:      http://localhost:${env.API_PORT}/health`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Frontend:    ${env.FRONTEND_URL}`);
  console.log('');
  console.log('  Active Routes:');
  console.log('    POST /api/insights/ai-advice');
  console.log('    POST /api/chat/stream');
  console.log('===========================================');
  console.log('');
});
