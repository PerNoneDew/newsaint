/*
# Create snapshots table for backup/restore persistence

1. New Tables
- `snapshots` — stores full data snapshots (backup + pre-reset) as JSON so they survive page refresh.
  - `id` (text PK), `name`, `type` ('backup' | 'pre_reset' | 'initial'), `created_at` (ISO string)
  - `data` (jsonb) — full snapshot payload: { users, healthRecords, requests, inventory, expenses, notifications, auditLogs, dispensingHistory }

2. Security
- RLS enabled, anon + authenticated full CRUD (single-tenant mock-auth app).
*/

CREATE TABLE IF NOT EXISTS snapshots (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  created_at text NOT NULL,
  data jsonb NOT NULL
);

ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_snapshots" ON snapshots;
CREATE POLICY "anon_select_snapshots" ON snapshots FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_snapshots" ON snapshots;
CREATE POLICY "anon_insert_snapshots" ON snapshots FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_snapshots" ON snapshots;
CREATE POLICY "anon_update_snapshots" ON snapshots FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_snapshots" ON snapshots;
CREATE POLICY "anon_delete_snapshots" ON snapshots FOR DELETE TO anon, authenticated USING (true);
