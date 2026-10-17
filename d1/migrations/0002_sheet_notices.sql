-- 已同步到規劃總表的通知（例如「即將重查」摘要），避免每週重複寫同一列。
CREATE TABLE sheet_notices (
  notice_key TEXT PRIMARY KEY,       -- 例如 due:rebun-island:2027-03
  synced_at TEXT NOT NULL
);
