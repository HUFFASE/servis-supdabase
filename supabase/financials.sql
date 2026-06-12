-- 1. Add hourly_cost to profiles table safely
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_cost NUMERIC NOT NULL DEFAULT 50;

-- 2. Update seed labor cost values for existing team roles
UPDATE profiles SET hourly_cost = 120 WHERE id = 'u1'; -- Kemal Yılmaz (Direktör)
UPDATE profiles SET hourly_cost = 90 WHERE id = 'u2';  -- Ayşe Kaya (Müdür)
UPDATE profiles SET hourly_cost = 60 WHERE id = 'u3';  -- Can Demir (Presales)
UPDATE profiles SET hourly_cost = 45 WHERE id = 'u4';  -- Elif Şahin (Postsales)
