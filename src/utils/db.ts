export async function initializeDatabase(db: D1Database): Promise<void> {
    try {
      // Create table with IF NOT EXISTS to avoid errors if already exists
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS pending_deletions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          place_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(place_id, user_id)
        );
      `).run();
  
      // Create indexes with IF NOT EXISTS
      await db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_place_id ON pending_deletions(place_id);
      `).run();
      
      await db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_user_id ON pending_deletions(user_id);
      `).run();
      
      await db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_created_at ON pending_deletions(created_at);
      `).run();
  
      console.log('Database initialization completed');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }