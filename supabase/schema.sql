-- Supabase PostgreSQL Migration Schema

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('Direktör', 'Müdür', 'Presales', 'Postsales');
CREATE TYPE case_severity AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE case_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE contract_status AS ENUM ('Active', 'Pending', 'Expired');
CREATE TYPE oneoff_status AS ENUM ('Draft', 'In Progress', 'Completed');
CREATE TYPE cert_status AS ENUM ('Active', 'Expiring', 'Expired');

-- 2. Create Tables
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'Postsales',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  description TEXT,
  price_per_hour NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE certificate_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_def_name_brand UNIQUE (name, brand_id)
);

CREATE TABLE certificates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status cert_status NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE contracts (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  sla_details TEXT,
  status contract_status NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE oneoffs (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status oneoff_status NOT NULL DEFAULT 'Draft',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity case_severity NOT NULL DEFAULT 'Medium',
  status case_status NOT NULL DEFAULT 'Open',
  assigned_to TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sla_countdown_hours NUMERIC NOT NULL DEFAULT 24
);

CREATE TABLE case_comments (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Seed Mock Data

-- Seed Profiles
INSERT INTO profiles (id, full_name, email, role, avatar_url) VALUES
('u1', 'Kemal Yılmaz', 'kemal@techservices.com', 'Direktör', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kemal'),
('u2', 'Ayşe Kaya', 'ayse@techservices.com', 'Müdür', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ayse'),
('u3', 'Can Demir', 'can@techservices.com', 'Presales', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Can'),
('u4', 'Elif Şahin', 'elif@techservices.com', 'Postsales', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Elif');

-- Seed Brands
INSERT INTO brands (id, name, logo_url, description) VALUES
('b1', 'Cisco', 'https://api.dicebear.com/7.x/initials/svg?seed=CS', 'Network ve güvenlik sistemleri lideri.'),
('b2', 'Fortinet', 'https://api.dicebear.com/7.x/initials/svg?seed=FT', 'Yeni nesil siber güvenlik ve SD-WAN çözümleri.'),
('b3', 'Microsoft', 'https://api.dicebear.com/7.x/initials/svg?seed=MS', 'Bulut altyapı, işletim sistemleri ve kurumsal çözümler.'),
('b4', 'VMware', 'https://api.dicebear.com/7.x/initials/svg?seed=VM', 'Sanallaştırma ve çoklu bulut yönetimi teknolojileri.');

-- Seed Services
INSERT INTO services (id, name, brand_id, description, price_per_hour) VALUES
('s1', 'Kurulum ve Konfigürasyon', 'b1', 'Cisco omurga ve kenar anahtarların kurulumu ve konfigürasyonu.', 150),
('s2', 'Firewall Kural Denetimi ve Güvenlik Sıkılaştırma', 'b2', 'Fortigate güvenlik duvarı kurallarının optimizasyonu.', 180),
('s3', 'Azure Bulut Migrasyon Danışmanlığı', 'b3', 'Yerel sunucuların Azure bulut ortamına taşınması tasarımı.', 220),
('s4', 'vSphere Küme Kurulumu ve Optimizasyonu', 'b4', 'VMware sanallaştırma altyapısının yedekli kurulumu.', 200);

-- Seed Certificate Definitions
INSERT INTO certificate_definitions (id, name, brand_id) VALUES
('cd1', 'CCIE Enterprise Infrastructure', 'b1'),
('cd2', 'NSE 8 Network Security Expert', 'b2'),
('cd3', 'Azure Solutions Architect Expert', 'b3');

-- Seed Certificates
INSERT INTO certificates (id, name, brand_id, profile_id, issue_date, expiry_date, status) VALUES
('c1', 'CCIE Enterprise Infrastructure', 'b1', 'u4', '2024-05-15', '2026-05-15', 'Expired'),
('c2', 'NSE 8 Network Security Expert', 'b2', 'u4', '2023-09-10', '2026-06-10', 'Expiring'),
('c3', 'Azure Solutions Architect Expert', 'b3', 'u3', '2025-01-20', '2027-01-20', 'Active');

-- Seed Customers
INSERT INTO customers (id, name, industry, contact_person, email, phone) VALUES
('cust1', 'Turkcell İletişim Hizmetleri', 'Telekomünikasyon', 'Ahmet Aksoy', 'ahmet.aksoy@turkcell.com.tr', '0532 111 2233'),
('cust2', 'Garanti BBVA Teknoloji', 'Finans / Bankacılık', 'Zeynep Balcı', 'zeynep.balci@garantibbva.com.tr', '0212 555 4433'),
('cust3', 'Eczacıbaşı Holding', 'Holding', 'Murat Can', 'murat.can@eczacibasi.com.tr', '0212 444 3322');

-- Seed Contracts
INSERT INTO contracts (id, customer_id, name, start_date, end_date, value, sla_details, status) VALUES
('con1', 'cust1', 'Turkcell Cisco Network Destek Sözleşmesi', '2026-01-01', '2026-12-31', 85000, '7/24 Destek, Kritik Durumlarda 2 Saat Müdahale Süresi', 'Active'),
('con2', 'cust2', 'Garanti Fortinet Firewall Bakım Anlaşması', '2025-07-01', '2026-07-01', 64000, '5/9 Destek, Kritik Durumlarda 4 Saat Müdahale Süresi', 'Active'),
('con3', 'cust3', 'Eczacıbaşı VMware Altyapı Desteği', '2025-01-01', '2025-12-31', 45000, '8/5 Destek, 8 Saat Müdahale Süresi', 'Expired');

-- Seed One-offs
INSERT INTO oneoffs (id, customer_id, name, amount, status) VALUES
('o1', 'cust1', 'Turkcell Kartal Veri Merkezi Migrasyonu', 120000, 'In Progress'),
('o2', 'cust2', 'Garanti Şube SD-WAN Dönüşüm Projesi', 95000, 'Draft'),
('o3', 'cust3', 'Eczacıbaşı Active Directory Yenileme Projesi', 35000, 'Completed');

-- Seed Cases
INSERT INTO cases (id, customer_id, contract_id, title, description, severity, status, assigned_to, created_at, sla_countdown_hours) VALUES
('t1', 'cust1', 'con1', 'Kartal Omurga Anahtarında Paket Kaybı', 'Veri merkezindeki Cisco Nexus anahtarda arayüz hataları gözlenmekte ve paket kaybı yaşanmaktadır. Trafik olumsuz etkilenmektedir.', 'Critical', 'In Progress', 'u4', NOW() - INTERVAL '3 hours', 1.8),
('t2', 'cust2', 'con2', 'Fortigate Firewall Kural Değişikliği Talebi', 'Yeni açılacak test sunucusu için DMZ bölgesinden dış dünyaya yönelik belirli portların (80, 443) erişime açılması talep edilmektedir.', 'Medium', 'Open', NULL, NOW() - INTERVAL '1 hours', 24.0),
('t3', 'cust3', NULL, 'Azure AD Lisans Aktivasyon Sorunu', 'Active Directory yenileme projesinin ardından bazı kullanıcıların E5 lisansları aktifleşmemektedir.', 'High', 'Resolved', 'u3', NOW() - INTERVAL '24 hours', 0);

-- Seed Case Comments
INSERT INTO case_comments (id, case_id, author, text, date) VALUES
('cc1', 't1', 'Can Demir', 'İlk incelemede fiber kablo hatası veya SFP modül arızası olabileceği tespit edildi. Fiziksel kontrol talep edildi.', NOW() - INTERVAL '2.5 hours'),
('cc2', 't1', 'Elif Şahin', 'SFP modülü yedek parça ile değiştirildi, arayüz hataları durdu. Paket kaybı gözlenmiyor, izlemeye alındı.', NOW() - INTERVAL '1 hours'),
('cc3', 't3', 'Can Demir', 'Microsoft portalındaki lisans atama kuralları güncellendi. Senkronizasyon tetiklendi ve sorun çözüldü.', NOW() - INTERVAL '20 hours');

-- Seed Notifications
INSERT INTO notifications (id, title, message, severity, timestamp, read) VALUES
('n1', 'Kritik Sertifika Süresi Doldu', 'Elif Şahin''e ait "CCIE Enterprise" sertifikasının süresi dolmuştur!', 'error', NOW() - INTERVAL '2 hours', FALSE),
('n2', 'Yeni Kritik Destek Talebi', 'Turkcell için "Kartal Omurga Anahtarında Paket Kaybı" başlıklı CRITICAL talep açılmıştır.', 'warning', NOW() - INTERVAL '3 hours', FALSE);


-- 4. Enable Realtime Replication for Tables (Run at the very end to prevent halting seeds)
-- In Supabase, if the publication 'supabase_realtime' doesn't exist yet, this block can throw an error which is safe to ignore once tables & seed data are created.
DO $$
BEGIN
  alter publication supabase_realtime add table profiles;
  alter publication supabase_realtime add table brands;
  alter publication supabase_realtime add table services;
  alter publication supabase_realtime add table certificate_definitions;
  alter publication supabase_realtime add table certificates;
  alter publication supabase_realtime add table customers;
  alter publication supabase_realtime add table contracts;
  alter publication supabase_realtime add table oneoffs;
  alter publication supabase_realtime add table cases;
  alter publication supabase_realtime add table case_comments;
  alter publication supabase_realtime add table notifications;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not configure realtime replication. You can enable replication manually in your Supabase dashboard.';
END $$;
