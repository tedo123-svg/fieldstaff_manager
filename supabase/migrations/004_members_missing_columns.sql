-- ============================================================
-- Migration 004: Add missing columns to members table
-- Run this in your Supabase SQL editor
-- ============================================================

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS group_id         uuid REFERENCES groups(id)          ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS work_location_id uuid REFERENCES work_locations(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_sharing       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_status  text    NOT NULL DEFAULT 'OFFLINE';

CREATE INDEX IF NOT EXISTS members_group_id_idx         ON members(group_id);
CREATE INDEX IF NOT EXISTS members_work_location_id_idx ON members(work_location_id);
CREATE INDEX IF NOT EXISTS members_is_sharing_idx       ON members(is_sharing);

-- ============================================================
-- Also create attendances table if it doesn't exist
-- ============================================================
CREATE TABLE IF NOT EXISTS attendances (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date       date NOT NULL DEFAULT CURRENT_DATE,
  check_in   timestamptz,
  check_out  timestamptz,
  status     text NOT NULL DEFAULT 'ABSENT',
  notes      text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(member_id, date)
);

CREATE INDEX IF NOT EXISTS attendances_member_id_idx ON attendances(member_id);
CREATE INDEX IF NOT EXISTS attendances_date_idx      ON attendances(date);

ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "read_attendances"
  ON attendances FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "write_attendances"
  ON attendances FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPER_ADMIN', 'ORG_MANAGER')
  );

-- ============================================================
-- Also create work_locations table if it doesn't exist
-- ============================================================
CREATE TABLE IF NOT EXISTS work_locations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  address              text NOT NULL DEFAULT '',
  latitude             double precision NOT NULL DEFAULT 0,
  longitude            double precision NOT NULL DEFAULT 0,
  organization_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  working_hours_start  text NOT NULL DEFAULT '08:00',
  working_hours_end    text NOT NULL DEFAULT '17:00',
  geofence_radius      integer NOT NULL DEFAULT 200,
  status               text NOT NULL DEFAULT 'ACTIVE',
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_locations_org_idx ON work_locations(organization_id);

ALTER TABLE work_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "read_work_locations"
  ON work_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "write_work_locations"
  ON work_locations FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPER_ADMIN', 'ORG_MANAGER')
  );

-- ============================================================
-- Also create gps_locations table if it doesn't exist
-- ============================================================
CREATE TABLE IF NOT EXISTS gps_locations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  latitude      double precision NOT NULL,
  longitude     double precision NOT NULL,
  accuracy      double precision,
  timestamp     timestamptz NOT NULL DEFAULT now(),
  is_sharing    boolean NOT NULL DEFAULT false,
  device_status text NOT NULL DEFAULT 'OFFLINE'
);

CREATE INDEX IF NOT EXISTS gps_locations_member_id_idx ON gps_locations(member_id);

ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "read_gps_locations"
  ON gps_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "write_gps_locations"
  ON gps_locations FOR ALL TO authenticated USING (true);
