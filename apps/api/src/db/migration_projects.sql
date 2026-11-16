-- Migration: Add projects table and link to transactions
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  color TEXT DEFAULT '#6366F1',
  status TEXT NOT NULL DEFAULT 'active',
  budget INTEGER DEFAULT 0,
  target_revenue INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Add project_id column to transactions if it doesn't already exist
-- SQLite ALTER TABLE ADD COLUMN is safe and idempotent when scripted carefully
ALTER TABLE transactions ADD COLUMN project_id TEXT REFERENCES projects(id);

CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
