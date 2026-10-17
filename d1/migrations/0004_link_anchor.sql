-- 待補內連要記錄連結句裡哪幾個字是錨文字；補連結時只把這幾個字加上連結。
ALTER TABLE pending_links ADD COLUMN anchor_text TEXT;
ALTER TABLE pending_links ADD COLUMN target_path TEXT;
