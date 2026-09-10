import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { actionsRouter } from './routes/actions.js';
import { sessionsRouter } from './routes/sessions.js';
import { auditRouter } from './routes/audit.js';
import { policiesRouter } from './routes/policies.js';
import { principalsRouter } from './routes/principals.js';
import { eventsRouter } from './routes/events.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.includes('/health')) {
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Standard API health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'sentinel-runtime',
    version: '1.4.2',
    timestamp: new Date().toISOString(),
  });
});

// Legacy root health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'sentinel-runtime',
    version: '1.4.2',
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use('/api/actions', actionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/policies', policiesRouter);
app.use('/api/principals', principalsRouter);
app.use('/api/events', eventsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER_ERROR]', err);
  res.status(500).json({
    error: 'Runtime engine internal error',
    message: err?.message || 'An unexpected error occurred',
  });
});

// Start server with EADDRINUSE handling
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  SENTINEL RUNTIME - Security Harness for AI Agents `);
  console.log(`  Engine Status: ACTIVE [Deterministic Enforcement] `);
  console.log(`  Backend API:   http://localhost:${PORT}             `);
  console.log(`====================================================`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is already in use by another process.`);
    console.error(`[FATAL] Please terminate the process using port ${PORT} or specify a different port with PORT=...`);
  } else {
    console.error(`[FATAL] Server encountered an error:`, err);
  }
  process.exit(1);
});

// Graceful shutdown
const handleShutdown = (signal: string) => {
  console.log(`\n[SERVER] Received ${signal}. Closing Sentinel Runtime API gracefully...`);
  server.close(() => {
    console.log('[SERVER] Server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default app;
