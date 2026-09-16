-- Tizims.uz Multi-Tenant Core — PostgreSQL target schema
-- Demo frontend uses the same IDs. Apply on a real DB before production cutover.
-- Existing HR rows MUST be backfilled with organization_id (IAU), never deleted.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  organization_type TEXT NOT NULL,
  logo TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT NOT NULL DEFAULT 'UZ',
  timezone TEXT NOT NULL DEFAULT 'Asia/Tashkent',
  currency TEXT NOT NULL DEFAULT 'UZS',
  status TEXT NOT NULL DEFAULT 'active',
  primary_color TEXT NOT NULL DEFAULT '#0984E3',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  module TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  status TEXT NOT NULL DEFAULT 'active',
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  settings JSONB NOT NULL DEFAULT '{}',
  activated_at TIMESTAMPTZ,
  UNIQUE (organization_id, module_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HR tenant columns (example). Repeat for departments, positions, contracts, leaves, attendance.
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE employees SET organization_id = '550e8400-e29b-41d4-a716-446655440001' WHERE organization_id IS NULL;
ALTER TABLE IF EXISTS employees ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS employees_org_idx ON employees (organization_id);
CREATE INDEX IF NOT EXISTS employees_org_id_idx ON employees (organization_id, id);

ALTER TABLE IF EXISTS departments ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE departments SET organization_id = '550e8400-e29b-41d4-a716-446655440001' WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS departments_org_idx ON departments (organization_id);

ALTER TABLE IF EXISTS positions ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE positions SET organization_id = '550e8400-e29b-41d4-a716-446655440001' WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS positions_org_idx ON positions (organization_id);

ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE contracts SET organization_id = '550e8400-e29b-41d4-a716-446655440001' WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS contracts_org_idx ON contracts (organization_id);

ALTER TABLE IF EXISTS leaves ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE leaves SET organization_id = '550e8400-e29b-41d4-a716-446655440001' WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS leaves_org_idx ON leaves (organization_id);

ALTER TABLE IF EXISTS attendance ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE attendance SET organization_id = '550e8400-e29b-41d4-a716-446655440001' WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS attendance_org_idx ON attendance (organization_id);

ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
-- Application must SET LOCAL app.organization_id = '<uuid>' per request.

-- Example RLS for employees (enable after backfill):
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY employees_tenant ON employees
--   USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
