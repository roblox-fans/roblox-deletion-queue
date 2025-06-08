export interface Env {
    DB: D1Database;
    WEBHOOK_SECRET?: string;
    API_KEY?: string;
    DISCORD_WEBHOOK_URL?: string;
  }
  
  export interface RobloxWebhookPayload {
    NotificationId: string;
    EventType: string;
    EventTime: string;
    EventPayload: {
      UserId: number;
      GameIds: number[];
    };
  }
  
  export interface PendingDeletion {
    id: number;
    universe_id: string;
    user_id: string;
    created_at: string;
  }
  
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  export interface DiscordWebhookPayload {
    content?: string;
    embeds?: Array<{
      title?: string;
      description?: string;
      color?: number;
      timestamp?: string;
      fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
      }>;
      footer?: {
        text: string;
        icon_url?: string;
      };
    }>;
  }