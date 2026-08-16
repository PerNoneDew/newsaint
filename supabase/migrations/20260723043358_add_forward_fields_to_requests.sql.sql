ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS forwarded_to text,
  ADD COLUMN IF NOT EXISTS forward_reason text,
  ADD COLUMN IF NOT EXISTS forwarded_at text;
