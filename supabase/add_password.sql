-- 1. Add password column to profiles table safely
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '123456';

-- 2. Update existing seeded profiles to have their default passwords
UPDATE profiles SET password = '123456' WHERE password IS NULL;
