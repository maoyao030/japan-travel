-- 補不上的待補內連可以略過（不再每輪重挑）；上稿、CI 等非內容失敗的次數。
ALTER TABLE pending_links ADD COLUMN skipped_at TEXT;
ALTER TABLE pending_links ADD COLUMN skip_reason TEXT;
ALTER TABLE article_status ADD COLUMN publish_failures INTEGER NOT NULL DEFAULT 0;
