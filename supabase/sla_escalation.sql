-- 1. Safely add new statuses to case_status ENUM
-- We check if they already exist before adding, to allow re-running the migration safely.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'case_status' AND e.enumlabel = 'Awaiting Customer'
  ) THEN
    ALTER TYPE case_status ADD VALUE 'Awaiting Customer';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'case_status' AND e.enumlabel = 'Awaiting Vendor'
  ) THEN
    ALTER TYPE case_status ADD VALUE 'Awaiting Vendor';
  END IF;
END
$$;
