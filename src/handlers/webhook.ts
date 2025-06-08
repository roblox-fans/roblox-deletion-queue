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
    const universeIds = payload.EventPayload.GameIds.map(id => id.toString());

    // Insert records into database with better error handling
    try {
      for (const universeId of universeIds) {
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO pending_deletions (universe_id, user_id)
          VALUES (?, ?)
        `).bind(universeId, userId).run();
      }
    } catch (dbError) {
      console.error('Database insert error:', dbError);
      return c.json({ success: false, error: 'Database operation failed' }, 500);
    }

    // Send Discord notification if configured
    if (c.env.DISCORD_WEBHOOK_URL) {
      try {
        const notification = createWebhookReceivedNotification(userId, universeIds);
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
        universeIds,
        message: 'Deletion requests queued successfully'
      }
    };

    return c.json(response);

  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}