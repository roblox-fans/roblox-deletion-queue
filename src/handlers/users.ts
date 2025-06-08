import { Context } from 'hono';
import { Env, ApiResponse } from '../types';
import { requireApiKey } from '../utils/auth';

export async function getUsersByUniverse(c: Context<{ Bindings: Env }>): Promise<Response> {
  // Check API key
  const authError = requireApiKey(c);
  if (authError) return authError;

  try {
    const universeId = c.req.param('universeId');
    
    if (!universeId) {
      return c.json({ success: false, error: 'Universe ID is required' }, 400);
    }

    let results;
    try {
      const queryResult = await c.env.DB.prepare(`
        SELECT user_id FROM pending_deletions 
        WHERE universe_id = ?
        ORDER BY created_at ASC
      `).bind(universeId).all();
      results = queryResult.results;
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return c.json({ success: false, error: 'Database operation failed' }, 500);
    }

    const userIds = results.map((row: any) => row.user_id);

    const response: ApiResponse<string[]> = {
      success: true,
      data: userIds
    };

    return c.json(response);

  } catch (error) {
    console.error('Get users by universe error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}

export async function getAllUsers(c: Context<{ Bindings: Env }>): Promise<Response> {
  // Check API key
  const authError = requireApiKey(c);
  if (authError) return authError;

  try {
    let results;
    try {
      const queryResult = await c.env.DB.prepare(`
        SELECT universe_id, user_id FROM pending_deletions 
        ORDER BY universe_id, created_at ASC
      `).all();
      results = queryResult.results;
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return c.json({ success: false, error: 'Database operation failed' }, 500);
    }

    // Group by universe_id
    const groupedData: Record<string, string[]> = {};
    for (const row of results as any[]) {
      const universeId = row.universe_id;
      const userId = row.user_id;
      
      if (!groupedData[universeId]) {
        groupedData[universeId] = [];
      }
      groupedData[universeId].push(userId);
    }

    const response: ApiResponse<Record<string, string[]>> = {
      success: true,
      data: groupedData
    };

    return c.json(response);

  } catch (error) {
    console.error('Get all users error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}