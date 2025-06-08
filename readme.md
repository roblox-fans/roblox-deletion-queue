# Roblox Auto Data Deleter (RADD)

A minimal, serverless API for managing Roblox user data deletion requests using Cloudflare Workers and D1.

## Setup

1. Log in to Cloudflare
https://dash.cloudflare.com

2.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Froblox-jp-dev%2FRADD)

## API Endpoints

### POST /webhook
Receives data deletion requests from Roblox.
- Headers: `roblox-signature` (required)
- Auth: Webhook signature verification

### GET /universes/{universeId}/users
Get pending deletion user IDs for a specific universe.
- Headers: `Authorization: Bearer {API_KEY}`
- Response: `["userId1", "userId2", ...]`

### GET /users
Get all pending deletion data grouped by universe.
- Headers: `Authorization: Bearer {API_KEY}`
- Response: `{"universeId1": ["userId1"], "universeId2": ["userId2"]}`

### DELETE /universes/{universeId}/users?userIds=user1,user2,user3
Mark deletions as completed (remove from queue).
- Headers: `Authorization: Bearer {API_KEY}`
- Query: `userIds` (comma-separated)

## Environment Variables

- `WEBHOOK_SECRET`: Secret for Roblox webhook signature verification
- `API_KEY`: API key for endpoint authentication
- `DISCORD_WEBHOOK_URL`: (Optional) Discord webhook URL for notifications