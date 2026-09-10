import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { actionsRouter } from './routes/actions.js';
import { sessionsRouter } from './routes/sessions.js';
import { auditRouter } from './routes/audit.js';
import { policiesRouter } from './routes/policies.js';
import { principalsRouter } from './routes/principals.js';
import { eventsRouter } from './routes/events.js';
import { sandboxRouter } from './routes/sandbox.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Allowed Origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3001',
    ];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (cURL, Python SDK, server-to-server) where origin is undefined
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin not allowed by Sentinel policy'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Operator-Role', 'X-Operator-ID'],
  credentials: true,
};

// Security headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Middleware
app.use(cors(corsOptions));
app.use(
  express.json({
    limit: '64kb',
    verify: (req: any, _res, buf) => {
      const raw = buf.toString();
      if (
        raw.includes('"__proto__"') ||
        raw.includes('"constructor"') ||
        raw.includes('"prototype"')
      ) {
        req.prototypePollutionDetected = true;
      }
    },
  })
);

// Gracefully handle malformed JSON errors from body-parser
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Malformed JSON payload provided in request body',
    });
    return;
  }
  next(err);
});

// Request logging (sanitized, zero secrets logged)
app.use((req: Request, res: Response, next: NextFunction) => {
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
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'sentinel-runtime',
    version: '1.4.2',
    timestamp: new Date().toISOString(),
  });
});

// Root health check
app.get('/health', (req: Request, res: Response) => {
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
app.use('/api/sandbox', sandboxRouter);

// Global Error Handler (Production-safe, no stack traces leaked)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER_ERROR]', err?.message || err);
  res.status(500).json({
    error: 'Runtime engine internal error',
    message: 'An unexpected server error occurred. Please contact the SOC administrator.',
  });
});

// Start server if not running inside test runner
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
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
}

export default app;
