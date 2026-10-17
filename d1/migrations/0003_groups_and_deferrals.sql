-- 旅行群的核准狀態（明確核准或默許），以及文章連續延後的起點。
CREATE TABLE group_status (
  group_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('awaiting-approval', 'approved', 'changes-requested', 'paused')),
  auto_approve_on TEXT NOT NULL,     -- YYYY-MM-DD（台北日期）
  approved_at TEXT,
  approved_by TEXT CHECK (approved_by IN ('darren', 'default')),
  note TEXT,
  updated_at TEXT NOT NULL
);

-- 來源打不開時第一次延後的時間；連續延後超過 3 天就停放。
ALTER TABLE article_status ADD COLUMN first_deferred_at TEXT;
