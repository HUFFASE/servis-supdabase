-- 1. Create timesheet_status type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'timesheet_status') THEN
    CREATE TYPE timesheet_status AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected');
  END IF;
END $$;

-- 2. Create timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  oneoff_id TEXT REFERENCES oneoffs(id) ON DELETE SET NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_spent NUMERIC(5,2) NOT NULL CHECK (hours_spent > 0 AND hours_spent <= 24),
  description TEXT NOT NULL,
  is_billable BOOLEAN NOT NULL DEFAULT TRUE,
  status timesheet_status NOT NULL DEFAULT 'Draft',
  approved_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seed some mock timesheets
INSERT INTO timesheets (id, profile_id, case_id, oneoff_id, activity_date, hours_spent, description, is_billable, status, approved_by) VALUES
('tms1', 'u4', 't1', NULL, '2026-05-26', 2.50, 'Cisco Nexus omurga anahtarında fiber kablo ve SFP modülü değişimi yapıldı. Paket kaybı gözlenmiyor.', TRUE, 'Approved', 'u2'),
('tms2', 'u4', 't2', NULL, '2026-05-27', 1.00, 'Fortigate firewall kurallarının optimizasyonu ve DMZ-WAN izinlerinin yazılması.', TRUE, 'Submitted', NULL),
('tms3', 'u3', NULL, 'o1', '2026-05-27', 4.50, 'Turkcell Kartal veri merkezi migrasyonu kapsamında sunucu taşıma planı hazırlandı.', FALSE, 'Draft', NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Realtime Replication for timesheets
DO $$
BEGIN
  alter publication supabase_realtime add table timesheets;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not configure realtime replication. You can enable replication manually in your Supabase dashboard.';
END $$;
