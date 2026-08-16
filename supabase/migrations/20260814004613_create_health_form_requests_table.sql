/*
# Create health_form_requests table

1. New Tables
- `health_form_requests` — stores student health record form submissions and their approval state.
  Columns:
  - id (text, primary key) — unique form request identifier.
  - user_id (text, not null) — submitter's user id (from users table).
  - user_name (text, not null) — submitter's display name.
  - user_role (text) — submitter's role (admin, health_officer, student, staff, faculty, employee).
  - department (text) — submitter's department.
  - form_data (jsonb, not null) — the filled-out health record template fields.
  - status (text, not null default 'pending') — pending | approved | rejected.
  - submitted_at (text, not null) — ISO date submitted.
  - updated_at (text, not null) — ISO date last updated.
  - reviewed_by (text) — name of admin/health_officer who reviewed.
  - review_notes (text) — optional notes from reviewer.

2. Security
- RLS enabled on health_form_requests.
- Anon + authenticated full CRUD (single-tenant, mock-auth app, same pattern as all other tables).

3. Notes
- form_data is a JSONB column holding the structured health form template (personal info, vitals, medical history, emergency contact, etc.).
- This table is intentionally separate from `requests` and `health_records` so the form template and approval flow are self-contained.
*/

CREATE TABLE IF NOT EXISTS health_form_requests (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_role text,
  department text,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  submitted_at text NOT NULL,
  updated_at text NOT NULL,
  reviewed_by text,
  review_notes text
);

ALTER TABLE health_form_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_health_form_requests" ON health_form_requests;
CREATE POLICY "anon_select_health_form_requests" ON health_form_requests FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_health_form_requests" ON health_form_requests;
CREATE POLICY "anon_insert_health_form_requests" ON health_form_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_health_form_requests" ON health_form_requests;
CREATE POLICY "anon_update_health_form_requests" ON health_form_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_health_form_requests" ON health_form_requests;
CREATE POLICY "anon_delete_health_form_requests" ON health_form_requests FOR DELETE TO anon, authenticated USING (true);
