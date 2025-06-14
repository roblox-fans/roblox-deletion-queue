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
      title: '🔔 RDQ: Data Deletion Request Received',
      description: 'A new data deletion request has been queued for processing.',
      color: 0x3498db, // Blue color for new requests
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '👤 User ID',
          value: `\`${userId}\``,
          inline: true
        },
        {
          name: '🏠 Start Place IDs',
          value: placeIds.map(id => `\`${id}\``).join(', '),
          inline: true
        },
        {
          name: '📝 Status',
          value: '✅ Added to deletion queue',
          inline: false
        },
        {
          name: '⏰ Timestamp',
          value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
          inline: false
        }
      ],
      footer: {
        text: 'RDQ - Deletion Request'
      }
    }]
  };
}

export function createDeletionCompletedNotification(placeId: string, userIds: string[]): DiscordWebhookPayload {
  return {
    embeds: [{
      title: '🗑️ RDQ: Data Deletion Completed',
      description: 'Data deletion has been successfully completed and removed from queue.',
      color: 0xe74c3c, // Red color for completed deletions
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '🏠 Start Place ID',
          value: `\`${placeId}\``,
          inline: true
        },
        {
          name: '👥 User IDs',
          value: userIds.map(id => `\`${id}\``).join(', '),
          inline: true
        },
        {
          name: '📊 Count',
          value: `${userIds.length} user(s)`,
          inline: true
        },
        {
          name: '✅ Status',
          value: '🔴 **DELETION COMPLETED**',
          inline: false
        },
        {
          name: '⏰ Completed At',
          value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
          inline: false
        }
      ],
      footer: {
        text: 'RDQ - Deletion Completed'
      }
    }]
  };
}