-- Migration 006: Add work_location_id to groups
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS work_location_id uuid REFERENCES work_locations(id) ON DELETE SET NULL;

-- Allow authenticated users to write work_locations
DROP POLICY IF EXISTS "read_work_locations"  ON work_locations;
DROP POLICY IF EXISTS "write_work_locations" ON work_locations;
CREATE POLICY "read_work_locations"  ON work_locations FOR SELECT USING (true);
CREATE POLICY "write_work_locations" ON work_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
