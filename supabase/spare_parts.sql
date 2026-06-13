-- 1. Create spare_part_status type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'spare_part_status') THEN
    CREATE TYPE spare_part_status AS ENUM ('InStock', 'Out');
  END IF;
END $$;

-- 2. Create spare_parts table
CREATE TABLE IF NOT EXISTS spare_parts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  part_code TEXT,
  serial_number TEXT,
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES oneoffs(id) ON DELETE SET NULL,
  is_pool BOOLEAN NOT NULL DEFAULT FALSE,
  stock_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stock_out_date DATE,
  status spare_part_status NOT NULL DEFAULT 'InStock',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seed some mock spare parts
INSERT INTO spare_parts (id, name, part_code, serial_number, brand_id, project_id, is_pool, stock_in_date, stock_out_date, status, notes) VALUES
('sp1', 'Cisco Nexus SFP-10G-SR Modülü', 'SFP-10G-SR', 'FDO24120ABC', 'b1', 'o1', FALSE, '2026-01-15', NULL, 'InStock', 'Turkcell Kartal migrasyonu için yedek optik modül.'),
('sp2', 'Fortinet FortiGate Güç Kaynağı Ünitesi', 'FG-PSU-460', 'SN-PSU-7781', 'b2', NULL, TRUE, '2025-08-10', NULL, 'InStock', 'Havuz yedeği - acil arıza durumları için.'),
('sp3', 'VMware Sunucu RAID Denetleyici Kartı', 'RAID-9460-16i', 'SV-RC-55012', 'b4', NULL, TRUE, '2025-03-01', '2026-04-20', 'Out', 'Eczacıbaşı sahasında arızalı kart yerine kullanıldı.'),
('sp4', 'Microsoft Surface Yedek Batarya', 'SRF-BAT-65W', 'MS-BAT-90233', 'b3', 'o2', FALSE, '2026-05-05', NULL, 'InStock', 'Garanti SD-WAN projesi saha ekibi için.')
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Realtime Replication for spare_parts
DO $$
BEGIN
  alter publication supabase_realtime add table spare_parts;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not configure realtime replication. You can enable replication manually in your Supabase dashboard.';
END $$;
