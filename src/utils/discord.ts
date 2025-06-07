import { DiscordWebhookPayload } from '../types';

export async function sendDiscordNotification(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Discord webhook error:', error);
  }
}

export function createWebhookReceivedNotification(userId: string, placeIds: string[]): DiscordWebhookPayload {
  return {
    embeds: [{
      title: '🔔 RADD: Data Deletion Request Received',
      color: 0x3498db,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: 'User ID',
          value: userId,
          inline: true
        },
        {
          name: 'Place IDs',
          value: placeIds.join(', '),
          inline: true
        },
        {
          name: 'Status',
          value: 'Added to deletion queue',
          inline: false
        }
      ]
    }]
  };
}

export function createDeletionCompletedNotification(placeId: string, userIds: string[]): DiscordWebhookPayload {
  return {
    embeds: [{
      title: '✅ RADD: Deletion Completed',
      color: 0x27ae60,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: 'Place ID',
          value: placeId,
          inline: true
        },
        {
          name: 'User IDs',
          value: userIds.join(', '),
          inline: true
        },
        {
          name: 'Count',
          value: userIds.length.toString(),
          inline: true
        }
      ]
    }]
  };
}