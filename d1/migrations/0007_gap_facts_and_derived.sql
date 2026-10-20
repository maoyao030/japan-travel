-- 缺口也當一筆事實登記（kind = 'gap'），用同一套重查機制；推算的事實記「算自哪幾筆」，來源變了一起標記。
ALTER TABLE facts ADD COLUMN kind TEXT NOT NULL DEFAULT 'fact';
ALTER TABLE facts ADD COLUMN gap_kind TEXT;
ALTER TABLE facts ADD COLUMN derived_from TEXT;
