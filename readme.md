# Roblox Auto Data Deleter (RADD)

A minimal, serverless API for managing Roblox user data deletion requests using Cloudflare Workers and D1.

## Setup

ここにCloudflareボタン

## API Endpoints

### POST /webhook
Receives data deletion requests from Roblox.
- Headers: `roblox-signature` (required)
- Auth: Webhook signature verification

### GET /places/{placeId}/users
Get pending deletion user IDs for a specific place.
- Headers: `Authorization: Bearer {API_KEY}`
- Response: `["userId1", "userId2", ...]`

### GET /users
Get all pending deletion data grouped by place.
- Headers: `Authorization: Bearer {API_KEY}`
- Response: `{"placeId1": ["userId1"], "placeId2": ["userId2"]}`

### DELETE /places/{placeId}/users?userIds=user1,user2,user3
Mark deletions as completed (remove from queue).
- Headers: `Authorization: Bearer {API_KEY}`
- Query: `userIds` (comma-separated)

## Environment Variables

- `WEBHOOK_SECRET`: Secret for Roblox webhook signature verification
- `API_KEY`: API key for endpoint authentication
- `DISCORD_WEBHOOK_URL`: (Optional) Discord webhook URL for notifications