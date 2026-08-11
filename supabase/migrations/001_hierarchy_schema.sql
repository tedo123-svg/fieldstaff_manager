-- ============================================================
-- FieldStaff Manager — Hierarchy Schema Migration
-- Subcity → Woreda → Organization → Group (orgs 1,2,3 only) → Member
-- ============================================================

-- 1. Subcities (ክፍለ ከተሞች)
CREATE TABLE IF NOT EXISTS subcities (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Woredas (ወረዳዎች)
CREATE TABLE IF NOT EXISTS woredas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  subcity_id uuid NOT NULL REFERENCES subcities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS woredas_subcity_idx ON woredas(subcity_id);

-- 3. Organizations — add has_groups flag
--    (orgs 1=Loader&Unloader, 2=Parking, 3=Queue Controller have groups)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS has_groups boolean NOT NULL DEFAULT false;

-- Mark first three orgs as having groups (run once after seeding orgs):
-- UPDATE organizations SET has_groups = true
--   WHERE name IN ('ጫኝ እና አውራጅ', 'ፓርኪንግ', 'ተራ አስከባሪ');

-- 4. Groups (ቡድኖች) — only for organizations where has_groups = true
CREATE TABLE IF NOT EXISTS groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  woreda_id       uuid NOT NULL REFERENCES woredas(id) ON DELETE RESTRICT,
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT groups_min_name CHECK (char_length(trim(name)) > 0)
);
CREATE INDEX IF NOT EXISTS groups_org_idx    ON groups(organization_id);
CREATE INDEX IF NOT EXISTS groups_woreda_idx ON groups(woreda_id);

-- 5. Members — add hierarchy columns
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS subcity_id uuid REFERENCES subcities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS woreda_id  uuid REFERENCES woredas(id)   ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_id   uuid REFERENCES groups(id)    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS members_subcity_idx ON members(subcity_id);
CREATE INDEX IF NOT EXISTS members_woreda_idx  ON members(woreda_id);
CREATE INDEX IF NOT EXISTS members_group_idx   ON members(group_id);

-- ============================================================
-- RLS Policies (adjust to match your existing auth setup)
-- ============================================================

ALTER TABLE subcities ENABLE ROW LEVEL SECURITY;
ALTER TABLE woredas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups    ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all lookup tables
CREATE POLICY "authenticated_read_subcities"
  ON subcities FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_woredas"
  ON woredas FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_groups"
  ON groups FOR SELECT TO authenticated USING (true);

-- Only SUPER_ADMIN can insert/update/delete lookup tables
-- (requires a profiles table with a role column)
CREATE POLICY "admin_write_subcities"
  ON subcities FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "admin_write_woredas"
  ON woredas FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "admin_write_groups"
  ON groups FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ORG_MANAGER'))
  );

-- ============================================================
-- Helper view: groups with member count
-- ============================================================
CREATE OR REPLACE VIEW groups_with_count AS
  SELECT
    g.*,
    COUNT(m.id) AS member_count
  FROM groups g
  LEFT JOIN members m ON m.group_id = g.id
  GROUP BY g.id;
