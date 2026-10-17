-- 維護資料庫（Cloudflare D1，私有）：放一直在變的維護狀態。
-- 規則、規劃與研究證據留在 Git；文章內容與「是否已發布、已開放索引」仍以 Sanity 為準。
-- 時間一律存 ISO 8601 字串（UTC），例如 2026-10-17T08:00:00Z；日期存 YYYY-MM-DD。

-- 執行鎖：同一時間只允許一個 routine 生產或維護。搶鎖用
--   INSERT ... ON CONFLICT(name) DO UPDATE ... WHERE run_lock.expires_at < 現在時間
-- 再看影響筆數是否為 1；逾時的鎖可以被接手。
CREATE TABLE run_lock (
  name TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  token TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- 每一輪的紀錄。最新一筆的時間就是「最後執行時間」，太久沒有新紀錄就列進每週摘要。
CREATE TABLE runs (
  run_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('produce', 'maintain', 'plan', 'summary')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  article_id TEXT,
  result TEXT CHECK (result IN ('accepted', 'published', 'fixed', 'parked', 'deferred', 'failed', 'no-work', 'done')),
  note TEXT
);
CREATE INDEX runs_started_at ON runs (started_at);

-- 文章的生產過程：輪數、停放、延後。發布與索引狀態不在這裡，看 Sanity。
CREATE TABLE article_status (
  article_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  target_path TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('queued', 'writing', 'accepted', 'published', 'parked', 'deferred')),
  attempts INTEGER NOT NULL DEFAULT 0,
  park_kind TEXT CHECK (park_kind IN ('needs-outline', 'facts', 'source-unreachable', 'other')),
  park_reason TEXT,
  defer_until TEXT,
  rules_version TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX article_status_state ON article_status (state);

-- 事實的查核狀態（更新後門）。事實本身的主張與日文原文摘錄在 Git 的地點事實表，
-- 這裡只用同一個編號記查核狀態；evidence_path 指回 Git 裡的檔案。
CREATE TABLE facts (
  fact_id TEXT PRIMARY KEY,          -- 例如 rebun-island:F12
  place_id TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'timetable', 'annual-event', 'price', 'stay', 'shop-hours', 'seasonal-opening', 'popularity', 'climate-normal', 'stable'
  )),
  source_url TEXT NOT NULL,
  evidence_path TEXT NOT NULL,
  last_checked_at TEXT NOT NULL,
  next_check_at TEXT,                -- stable 不填
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'changed', 'unreachable', 'removed')),
  source_fingerprint TEXT,           -- 來源頁內容指紋；沒變就跳過重查
  updated_at TEXT NOT NULL
);
CREATE INDEX facts_next_check_at ON facts (next_check_at);
CREATE INDEX facts_source_url ON facts (source_url);
CREATE INDEX facts_place_id ON facts (place_id);

-- 哪幾頁用到哪筆事實：事實到期或改變時，一次找出要改的頁面。
CREATE TABLE fact_usage (
  fact_id TEXT NOT NULL REFERENCES facts (fact_id),
  article_id TEXT NOT NULL,
  PRIMARY KEY (fact_id, article_id)
);
CREATE INDEX fact_usage_article_id ON fact_usage (article_id);

-- 每次重查的結果。
CREATE TABLE fact_checks (
  check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  fact_id TEXT NOT NULL REFERENCES facts (fact_id),
  run_id TEXT REFERENCES runs (run_id),
  checked_at TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('unchanged', 'changed', 'unreachable', 'removed', 'skipped-same-fingerprint')),
  note TEXT
);
CREATE INDEX fact_checks_fact_id ON fact_checks (fact_id);

-- 待補內連：連結句已經寫在正文，目標頁上線後只把那句加上連結。
CREATE TABLE pending_links (
  link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_article_id TEXT NOT NULL,
  to_article_id TEXT NOT NULL,
  section TEXT,
  sentence TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('outline', 'cross-group')),
  created_at TEXT NOT NULL,
  linked_at TEXT
);
CREATE INDEX pending_links_to_article ON pending_links (to_article_id, linked_at);

-- 跨群回補：新地點上線後，要補進舊地點的欄位或舊頁結尾的相關連結。
CREATE TABLE backfill_tasks (
  task_id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('place-field', 'end-link')),
  target_id TEXT NOT NULL,           -- 要被修改的舊地點或舊文章
  new_id TEXT NOT NULL,              -- 新上線的地點或文章
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'parked')),
  created_at TEXT NOT NULL,
  done_at TEXT,
  note TEXT
);
CREATE INDEX backfill_tasks_status ON backfill_tasks (status);

-- 例外：需要 Darren 處理或知道的事，每週同步到規劃總表的「例外與更新」分頁。
CREATE TABLE exceptions (
  exception_id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('parked', 'source-gone', 'big-change', 'outline-exception', 'stale-run', 'other')),
  subject TEXT NOT NULL,             -- 群、頁面或事實編號
  detail TEXT NOT NULL,
  action_needed TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_at TEXT,
  synced_to_sheet_at TEXT
);
CREATE INDEX exceptions_status ON exceptions (status);
