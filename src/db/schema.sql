-- Roblox Auto Data Deleter (RADD) Database Schema
-- Table: pending_deletions

CREATE TABLE IF NOT EXISTS pending_deletions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(place_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_place_id ON pending_deletions(place_id);
CREATE INDEX IF NOT EXISTS idx_user_id ON pending_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON pending_deletions(created_at);