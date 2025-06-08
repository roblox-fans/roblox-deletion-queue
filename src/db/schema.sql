-- Roblox Auto Data Deleter (RADD) Database Schema
-- Table: pending_deletions

CREATE TABLE IF NOT EXISTS pending_deletions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    universe_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(universe_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_universe_id ON pending_deletions(universe_id);
CREATE INDEX IF NOT EXISTS idx_user_id ON pending_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON pending_deletions(created_at);