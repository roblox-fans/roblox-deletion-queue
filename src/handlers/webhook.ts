import { Context } from 'hono';
import { Env, RobloxWebhookPayload, ApiResponse } from '../types';
import { verifyWebhookSignature } from '../utils/crypto';
import { sendDiscordNotification, createWebhookReceivedNotification } from '../utils/discord';

export async function handleWebhook(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Check if webhook secret is configured
    if (!c.env.WEBHOOK_SECRET) {
      return c.json({ success: false, error: 'Webhook authentication not configured' }, 503);
    }

    const body = await c.req.text();
    const signature = c.req.header('roblox-signature');

    if (!signature) {
      return c.json({ success: false, error: 'Missing signature header' }, 400);
    }

    // Verify signature
    const isValid = await verifyWebhookSignature(body, signature, c.env.WEBHOOK_SECRET);
    if (!isValid) {
      return c.json({ success: false, error: 'Invalid signature' }, 401);
    }

    // Parse payload
    let payload: RobloxWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      return c.json({ success: false, error: 'Invalid JSON payload' }, 400);
    }

    // Validate payload
    if (payload.EventType !== 'RightToErasureRequest' || 
        !payload.EventPayload || 
        typeof payload.EventPayload.UserId !== 'number' ||
        !Array.isArray(payload.EventPayload.GameIds)) {
      return c.json({ success: false, error: 'Invalid payload format' }, 400);
    }

    const userId = payload.EventPayload.UserId.toString();
    const placeIds = payload.EventPayload.GameIds.map(id => id.toString());

    // Insert records into database and track actual insertions
    let totalInserted = 0;
    try {
      for (const placeId of placeIds) {
        const result = await c.env.DB.prepare(`
          INSERT INTO pending_deletions (place_id, user_id)
          VALUES (?, ?)
          ON CONFLICT(place_id, user_id) DO NOTHING
        `).bind(placeId, userId).run();
        
        if (result.changes > 0) {
          totalInserted++;
        }
      }
    } catch (dbError) {
      console.error('Database insert error:', dbError);
      return c.json({ success: false, error: 'Database operation failed' }, 500);
    }

    // Only send Discord notification if at least one record was actually inserted
    if (c.env.DISCORD_WEBHOOK_URL && totalInserted > 0) {
      try {
        const notification = createWebhookReceivedNotification(userId, placeIds);
        await sendDiscordNotification(c.env.DISCORD_WEBHOOK_URL, notification);
      } catch (discordError) {
        console.error('Discord notification error:', discordError);
        // Don't fail the request for Discord errors
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        userId,
        placeIds,
        totalInserted,
        message: `Successfully queued ${totalInserted} new deletion request(s)`
      }
    };

    return c.json(response);

  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}