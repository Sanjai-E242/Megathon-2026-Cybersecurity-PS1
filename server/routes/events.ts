import { Router, Request, Response } from 'express';
import { store, RealtimeEventPayload } from '../data/store.js';

export const eventsRouter = Router();

// GET /api/events - Server-Sent Events (SSE) stream for live action broadcasts
eventsRouter.get('/', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Sentinel Realtime Stream Active', timestamp: new Date().toISOString() })}\n\n`);

  // Event handler
  const handleRealtimeEvent = (payload: RealtimeEventPayload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  store.on('realtime_event', handleRealtimeEvent);

  // Heartbeat every 20 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 20000);

  // Cleanup on client disconnect
  req.on('close', () => {
    store.off('realtime_event', handleRealtimeEvent);
    clearInterval(heartbeat);
  });
});
