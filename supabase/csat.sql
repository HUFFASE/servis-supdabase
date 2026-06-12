-- 1. Create case_feedbacks table
CREATE TABLE IF NOT EXISTS case_feedbacks (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE UNIQUE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seed mock case feedback for t3 (which is resolved in mock cases)
INSERT INTO case_feedbacks (id, case_id, rating, comments) VALUES
('cf1', 't3', 5, 'Can Demir yerel Active Directory ve portal eşitleme problemlerimizi çok hızlı ve profesyonelce çözdü. Çok teşekkürler!')
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Realtime Replication for case_feedbacks
DO $$
BEGIN
  alter publication supabase_realtime add table case_feedbacks;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not configure realtime replication. You can enable replication manually in your Supabase dashboard.';
END $$;
