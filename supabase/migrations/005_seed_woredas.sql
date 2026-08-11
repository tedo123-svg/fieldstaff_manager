-- ============================================================
-- Migration 005: Seed woredas 1-15 for all subcities
-- Run this in your Supabase SQL editor
-- ============================================================

-- First fix RLS so reads work for all users
DROP POLICY IF EXISTS "read_subcities" ON subcities;
CREATE POLICY "read_subcities" ON subcities FOR SELECT USING (true);

DROP POLICY IF EXISTS "read_woredas" ON woredas;
CREATE POLICY "read_woredas" ON woredas FOR SELECT USING (true);

-- Seed 15 woredas for every subcity that exists
INSERT INTO woredas (name, subcity_id)
SELECT
  'ወረዳ ' || n AS name,
  s.id AS subcity_id
FROM subcities s
CROSS JOIN generate_series(1, 15) AS n
WHERE NOT EXISTS (
  SELECT 1 FROM woredas w
  WHERE w.subcity_id = s.id AND w.name = 'ወረዳ ' || n
);
