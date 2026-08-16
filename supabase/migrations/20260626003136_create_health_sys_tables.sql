/*
# Create HEALTH SYS SFCG schema (single-tenant, no Supabase auth)

This app uses mock login (email/password checked against a `users` table), NOT Supabase Auth.
Therefore it is single-tenant: the anon-key frontend must be able to read and write all tables.
All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because
the data is intentionally shared across the single deployment.

1. New Tables
- `users` — accounts with role, department, status, IDs, and a `password` column for mock auth.
- `health_records` — patient health records (blood type, allergies, conditions, vitals, etc.).
- `medicine_dispensing` — dispensing events linked to a patient + medicine.
- `requests` — patient service requests (certificates, consultations, referrals, etc.).
- `medicines` — inventory items with stock levels and expiry.
- `expenses` — liquidation tracking records.
- `notifications` — system announcements/alerts with recipient roles.
- `audit_logs` — user activity and login history.
- `backup_records` — backup history entries.

2. Security
- RLS enabled on every table.
- Anon + authenticated full CRUD on all tables (single-tenant, mock-auth app).

3. Notes
- Arrays (allergies, conditions, medications, attachments, recipient_roles) use `text[]`.
- JSONB columns store flexible nested objects (referral info, review data).
- `password` stored in plaintext to match the existing mock-auth behavior (not production-grade, but preserves current functionality).
*/

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  department text,
  student_id text,
  employee_id text,
  faculty_id text,
  admin_id text,
  officer_id text,
  status text NOT NULL DEFAULT 'active',
  created_at text NOT NULL,
  password text NOT NULL DEFAULT ''
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS health_records (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_role text,
  department text,
  student_id text,
  employee_id text,
  faculty_id text,
  admin_id text,
  officer_id text,
  blood_type text NOT NULL,
  allergies text[] NOT NULL DEFAULT '{}',
  conditions text[] NOT NULL DEFAULT '{}',
  medications text[] NOT NULL DEFAULT '{}',
  height text,
  weight text,
  bmi text,
  vision text,
  dental_status text,
  last_checkup text,
  next_checkup text,
  emergency_contact text,
  emergency_phone text,
  notes text,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  archived boolean NOT NULL DEFAULT false
);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_health_records" ON health_records;
CREATE POLICY "anon_select_health_records" ON health_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_health_records" ON health_records;
CREATE POLICY "anon_insert_health_records" ON health_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_health_records" ON health_records;
CREATE POLICY "anon_update_health_records" ON health_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_health_records" ON health_records;
CREATE POLICY "anon_delete_health_records" ON health_records FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS medicine_dispensing (
  id text PRIMARY KEY,
  medicine_id text NOT NULL,
  medicine_name text NOT NULL,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  patient_role text,
  quantity integer NOT NULL,
  unit text NOT NULL,
  dispensed_by text NOT NULL,
  dispensed_at text NOT NULL,
  reason text NOT NULL
);

ALTER TABLE medicine_dispensing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_dispensing" ON medicine_dispensing;
CREATE POLICY "anon_select_dispensing" ON medicine_dispensing FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dispensing" ON medicine_dispensing;
CREATE POLICY "anon_insert_dispensing" ON medicine_dispensing FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_dispensing" ON medicine_dispensing;
CREATE POLICY "anon_update_dispensing" ON medicine_dispensing FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dispensing" ON medicine_dispensing;
CREATE POLICY "anon_delete_dispensing" ON medicine_dispensing FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS requests (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_role text,
  type text NOT NULL,
  description text NOT NULL,
  status text NOT NULL,
  attachments text[] NOT NULL DEFAULT '{}',
  submitted_at text NOT NULL,
  updated_at text NOT NULL,
  reviewed_by text,
  review_notes text,
  remarks text,
  forwarded_by text,
  referral_personnel text,
  referral_facility text,
  referral_reason text
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_requests" ON requests;
CREATE POLICY "anon_select_requests" ON requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_requests" ON requests;
CREATE POLICY "anon_insert_requests" ON requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_requests" ON requests;
CREATE POLICY "anon_update_requests" ON requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_requests" ON requests;
CREATE POLICY "anon_delete_requests" ON requests FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS medicines (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  quantity integer NOT NULL,
  unit text NOT NULL,
  min_stock integer NOT NULL,
  expiry_date text NOT NULL,
  supplier text NOT NULL,
  last_updated text NOT NULL,
  primary_key_date text
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_medicines" ON medicines;
CREATE POLICY "anon_select_medicines" ON medicines FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_medicines" ON medicines;
CREATE POLICY "anon_insert_medicines" ON medicines FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_medicines" ON medicines;
CREATE POLICY "anon_update_medicines" ON medicines FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_medicines" ON medicines;
CREATE POLICY "anon_delete_medicines" ON medicines FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS expenses (
  id text PRIMARY KEY,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  date text NOT NULL,
  recorded_by text NOT NULL,
  receipt_no text NOT NULL,
  status text NOT NULL,
  reviewed_by text,
  review_notes text,
  liquidated_at text
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  recipient_roles text[] NOT NULL DEFAULT '{}',
  recipient_ids text[],
  sent_by text NOT NULL,
  sent_at text NOT NULL,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  user_name text NOT NULL,
  action text NOT NULL,
  module text NOT NULL,
  details text NOT NULL,
  ip_address text NOT NULL,
  timestamp text NOT NULL,
  type text NOT NULL
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_audit_logs" ON audit_logs;
CREATE POLICY "anon_update_audit_logs" ON audit_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;
CREATE POLICY "anon_delete_audit_logs" ON audit_logs FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS backup_records (
  id text PRIMARY KEY,
  filename text NOT NULL,
  size text NOT NULL,
  created_at text NOT NULL,
  created_by text NOT NULL,
  status text NOT NULL,
  type text NOT NULL
);

ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_backup_records" ON backup_records;
CREATE POLICY "anon_select_backup_records" ON backup_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_backup_records" ON backup_records;
CREATE POLICY "anon_insert_backup_records" ON backup_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_backup_records" ON backup_records;
CREATE POLICY "anon_update_backup_records" ON backup_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_backup_records" ON backup_records;
CREATE POLICY "anon_delete_backup_records" ON backup_records FOR DELETE TO anon, authenticated USING (true);
