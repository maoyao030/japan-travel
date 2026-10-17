-- 補內連後網站 CI 失敗的次數；連續失敗太多次就略過，避免每輪都補了又回復。
ALTER TABLE pending_links ADD COLUMN failures INTEGER NOT NULL DEFAULT 0;
