import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { handleWebhook } from './handlers/webhook';
import { getUsersByUniverse, getAllUsers } from './handlers/users';
import { handleDeletionCompleted } from './handlers/delete';
import { initializeDatabase } from './utils/db';

const app = new Hono<{ Bindings: Env }>();

// Database initialization middleware
app.use('*', async (c, next) => {
  try {
    await initializeDatabase(c.env.DB);
  } catch (error) {
    console.error('Database initialization failed:', error);
    return c.json({ success: false, error: 'Database initialization failed' }, 500);
  }
  await next();
});

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'roblox-signature'],
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    success: true, 
    message: 'Roblox Auto Data Deleter (RADD) API is running',
    version: '1.0.0'
  });
});

// Webhook endpoint - receives deletion requests from Roblox
app.post('/webhook', handleWebhook);

// Get pending users for a specific universe
app.get('/universes/:universeId/users', getUsersByUniverse);

// Get all pending users grouped by universe
app.get('/users', getAllUsers);

// Mark deletions as completed (remove from queue)
app.delete('/universes/:universeId/users', handleDeletionCompleted);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Endpoint not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Global error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

export default app;