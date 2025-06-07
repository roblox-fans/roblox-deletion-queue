import { Context } from 'hono';
import { Env, ApiResponse } from '../types';
import { requireApiKey } from '../utils/auth';

export async function getUsersByPlace(c: Context<{ Bindings: Env }>): Promise<Response> {
  // Check API key
  const authError = requireApiKey(c);
  if (authError) return authError;

  try {
    const placeId = c.req.param('placeId');
    
    if (!placeId) {
      return c.json({ success: false, error: 'Place ID is required' }, 400);
    }

    const { results } = await c.env.DB.prepare(`
      SELECT user_id FROM pending_deletions 
      WHERE place_id = ?
      ORDER BY created_at ASC
    `).bind(placeId).all();

    const userIds = results.map((row: any) => row.user_id);

    const response: ApiResponse<string[]> = {
      success: true,
      data: userIds
    };

    return c.json(response);

  } catch (error) {
    console.error('Get users by place error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}

export async function getAllUsers(c: Context<{ Bindings: Env }>): Promise<Response> {
  // Check API key
  const authError = requireApiKey(c);
  if (authError) return authError;

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT place_id, user_id FROM pending_deletions 
      ORDER BY place_id, created_at ASC
    `).all();

    // Group by place_id
    const groupedData: Record<string, string[]> = {};
    for (const row of results as any[]) {
      const placeId = row.place_id;
      const userId = row.user_id;
      
      if (!groupedData[placeId]) {
        groupedData[placeId] = [];
      }
      groupedData[placeId].push(userId);
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