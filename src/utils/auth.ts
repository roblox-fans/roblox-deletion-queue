import { Context } from 'hono';
import { Env } from '../types';

export function verifyApiKey(c: Context<{ Bindings: Env }>): boolean {
  const apiKey = c.env.API_KEY;
  if (!apiKey) {
    return false;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedKey = authHeader.slice(7);
  return providedKey === apiKey;
}

export function requireApiKey(c: Context<{ Bindings: Env }>) {
  if (!c.env.API_KEY) {
    return c.json({ success: false, error: 'API authentication not configured' }, 503);
  }

  if (!verifyApiKey(c)) {
    return c.json({ success: false, error: 'Invalid or missing API key' }, 401);
  }

  return null;
}