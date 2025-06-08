import { Context } from 'hono';
import { Env, ApiResponse } from '../types';
import { requireApiKey } from '../utils/auth';
import { sendDiscordNotification, createDeletionCompletedNotification } from '../utils/discord';

export async function handleDeletionCompleted(c: Context<{ Bindings: Env }>): Promise<Response> {
  // Check API key
  const authError = requireApiKey(c);
  if (authError) return authError;

  try {
    const universeId = c.req.param('universeId');
    
    // Try multiple ways to get userIds parameter
    const url = new URL(c.req.url);
    const userIdsParam = url.searchParams.get('userIds') || c.req.query('userIds');

    console.log(`Deletion request - Universe ID: ${universeId}, User IDs param: ${userIdsParam}`);

    if (!universeId) {
      return c.json({ success: false, error: 'Universe ID is required' }, 400);
    }

    if (!userIdsParam) {
      return c.json({ success: false, error: 'userIds query parameter is required' }, 400);
    }

    const userIds = userIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0);

    if (userIds.length === 0) {
      return c.json({ success: false, error: 'At least one user ID is required' }, 400);
    }

    console.log(`Processing deletion for Universe ID: ${universeId}, User IDs: ${userIds.join(', ')}`);

    // First check if data exists
    let existingData;
    try {
      const placeholders = userIds.map(() => '?').join(',');
      const checkQuery = `
        SELECT user_id FROM pending_deletions 
        WHERE universe_id = ? AND user_id IN (${placeholders})
      `;
      const checkParams = [universeId, ...userIds];
      const checkResult = await c.env.DB.prepare(checkQuery).bind(...checkParams).all();
      existingData = checkResult.results;
      console.log(`Found ${existingData.length} existing records to delete`);
    } catch (checkError) {
      console.error('Database check error:', checkError);
      return c.json({ success: false, error: 'Database operation failed' }, 500);
    }

    // Delete records from database
    let deletedCount = 0;
    if (existingData.length > 0) {
      try {
        const placeholders = userIds.map(() => '?').join(',');
        const query = `
          DELETE FROM pending_deletions 
          WHERE universe_id = ? AND user_id IN (${placeholders})
        `;
        
        const params = [universeId, ...userIds];
        const result = await c.env.DB.prepare(query).bind(...params).run();
        
        // Handle different possible result formats
        deletedCount = result.changes || result.meta?.changes || existingData.length || 0;
        console.log(`Database deletion result:`, result);
        console.log(`Deleted count: ${deletedCount}`);
      } catch (dbError) {
        console.error('Database delete error:', dbError);
        return c.json({ success: false, error: 'Database operation failed' }, 500);
      }
    } else {
      console.log('No records found to delete');
    }

    // Send Discord notification if configured and data was actually deleted
    if (c.env.DISCORD_WEBHOOK_URL && deletedCount > 0) {
      try {
        console.log(`Sending Discord completion notification for ${deletedCount} deletions`);
        const notification = createDeletionCompletedNotification(universeId, userIds);
        await sendDiscordNotification(c.env.DISCORD_WEBHOOK_URL, notification);
        console.log('Discord completion notification sent successfully');
      } catch (discordError) {
        console.error('Discord notification error:', discordError);
        // Don't fail the request for Discord errors
      }
    } else if (!c.env.DISCORD_WEBHOOK_URL) {
      console.log('Discord webhook URL not configured, skipping notification');
    } else if (deletedCount === 0) {
      console.log('No records deleted, skipping Discord notification');
    }

    const response: ApiResponse = {
      success: true,
      data: {
        universeId,
        userIds,
        deletedCount,
        message: `Successfully marked ${deletedCount} deletion(s) as completed`
      }
    };

    return c.json(response);

  } catch (error) {
    console.error('Deletion completion error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}