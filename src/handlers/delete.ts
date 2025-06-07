import { Context } from 'hono';
import { Env, ApiResponse } from '../types';
import { requireApiKey } from '../utils/auth';
import { sendDiscordNotification, createDeletionCompletedNotification } from '../utils/discord';

export async function handleDeletionCompleted(c: Context<{ Bindings: Env }>): Promise<Response> {
  // Check API key
  const authError = requireApiKey(c);
  if (authError) return authError;

  try {
    const placeId = c.req.param('placeId');
    const userIdsParam = c.req.query('userIds');

    if (!placeId) {
      return c.json({ success: false, error: 'Place ID is required' }, 400);
    }

    if (!userIdsParam) {
      return c.json({ success: false, error: 'userIds query parameter is required' }, 400);
    }

    const userIds = userIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0);

    if (userIds.length === 0) {
      return c.json({ success: false, error: 'At least one user ID is required' }, 400);
    }

    // Delete records from database
    let result;
    try {
      const placeholders = userIds.map(() => '?').join(',');
      const query = `
        DELETE FROM pending_deletions 
        WHERE place_id = ? AND user_id IN (${placeholders})
      `;
      
      const params = [placeId, ...userIds];
      result = await c.env.DB.prepare(query).bind(...params).run();
    } catch (dbError) {
      console.error('Database delete error:', dbError);
      return c.json({ success: false, error: 'Database operation failed' }, 500);
    }

    // Send Discord notification if configured
    if (c.env.DISCORD_WEBHOOK_URL && result.changes > 0) {
      try {
        const notification = createDeletionCompletedNotification(placeId, userIds);
        await sendDiscordNotification(c.env.DISCORD_WEBHOOK_URL, notification);
      } catch (discordError) {
        console.error('Discord notification error:', discordError);
        // Don't fail the request for Discord errors
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        placeId,
        userIds,
        deletedCount: result.changes,
        message: `Successfully marked ${result.changes} deletion(s) as completed`
      }
    };

    return c.json(response);

  } catch (error) {
    console.error('Deletion completion error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}