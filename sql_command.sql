-- ============================================================
-- OPD & Doctor Backend — SQL Migration Commands
-- Run these against your Supabase database
-- ============================================================

-- 1. Create doctor_print_layouts table: store print layout and offsets config per company
CREATE TABLE IF NOT EXISTS doctor_print_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  format_config jsonb NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_print_layouts_company ON doctor_print_layouts(company_id);

-- 2. CREATE / ALTER other OPD tables
-- ALTER companies table: Add prescription format settings column
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS prescription_format_config jsonb DEFAULT NULL;

-- 3. Create opd_patients table
CREATE TABLE IF NOT EXISTS opd_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  age integer NOT NULL DEFAULT 0,
  gender text NOT NULL DEFAULT 'Male',
  address text,
  blood_group text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, phone)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_opd_patients_company ON opd_patients(company_id);
CREATE INDEX IF NOT EXISTS idx_opd_patients_phone ON opd_patients(company_id, phone);
CREATE INDEX IF NOT EXISTS idx_opd_patients_name ON opd_patients(company_id, name);

-- 3. Create opd_visits table
CREATE TABLE IF NOT EXISTS opd_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES opd_patients(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  token_no integer NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  vitals jsonb,
  prescription jsonb,
  bill jsonb,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast today-queue lookups
CREATE INDEX IF NOT EXISTS idx_opd_visits_company_date ON opd_visits(company_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_opd_visits_patient ON opd_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_visits_status ON opd_visits(company_id, visit_date, status);

-- 4. Create opd_bill_counters table
CREATE TABLE IF NOT EXISTS opd_bill_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date date NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  UNIQUE(company_id, date)
);

-- 5. Create opd_custom_items table
CREATE TABLE IF NOT EXISTS opd_custom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('medicine', 'test', 'diagnosis')),
  name text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, item_type, name)
);

-- Index for fast lookups by type
CREATE INDEX IF NOT EXISTS idx_opd_custom_items_type ON opd_custom_items(company_id, item_type);

-- 6. Create opd_prescription_templates table
CREATE TABLE IF NOT EXISTS opd_prescription_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  prescription jsonb NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_opd_templates_company ON opd_prescription_templates(company_id);

-- ============================================================
-- RLS Policies (optional — uncomment if RLS is enabled)
-- ============================================================

-- ALTER TABLE opd_patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE opd_visits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE opd_bill_counters ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE opd_custom_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE opd_prescription_templates ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow all for service role" ON opd_patients FOR ALL USING (true);
-- CREATE POLICY "Allow all for service role" ON opd_visits FOR ALL USING (true);
-- CREATE POLICY "Allow all for service role" ON opd_bill_counters FOR ALL USING (true);
-- CREATE POLICY "Allow all for service role" ON opd_custom_items FOR ALL USING (true);
-- CREATE POLICY "Allow all for service role" ON opd_prescription_templates FOR ALL USING (true);
