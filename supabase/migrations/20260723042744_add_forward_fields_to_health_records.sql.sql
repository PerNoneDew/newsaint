/*
# Add patient forward/transfer fields to health_records

1. Purpose
- Lets a health officer forward (transfer) a patient to another facility/personnel
  and track the forwarding status, destination, reason, who forwarded, and when.

2. New Columns on `health_records`
- `forward_status` (text, default 'active') — one of: active | forwarded | transferred
- `forwarded_to` (text, nullable) — name of receiving facility or personnel
- `forward_reason` (text, nullable) — reason for forwarding the patient
- `forwarded_by` (text, nullable) — name of the officer who forwarded the patient
- `forwarded_at` (text, nullable) — ISO date when the patient was forwarded

3. Security
- No RLS policy changes. Existing policies already allow anon/authenticated CRUD
  on health_records (single-tenant app, no sign-in gate on this table).

4. Notes
- All additions are nullable / have safe defaults, so existing rows and inserts
  that omit these columns continue to work unchanged.
- Idempotent: uses ADD COLUMN IF NOT EXISTS.
*/

ALTER TABLE health_records
  ADD COLUMN IF NOT EXISTS forward_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS forwarded_to text,
  ADD COLUMN IF NOT EXISTS forward_reason text,
  ADD COLUMN IF NOT EXISTS forwarded_by text,
  ADD COLUMN IF NOT EXISTS forwarded_at text;
