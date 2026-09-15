-- Migration: Create medicines master table
-- Created: 2026-09-16

CREATE TABLE IF NOT EXISTS public.medicines (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  brand_name   TEXT        GENERATED ALWAYS AS (split_part(name, '. ', 1)) STORED,
  composition  TEXT        GENERATED ALWAYS AS (
                 CASE WHEN position('. ' IN name) > 0
                   THEN substring(name FROM position('. ' IN name) + 2)
                   ELSE name
                 END
               ) STORED,
  form         TEXT        NOT NULL DEFAULT 'tablet',
  frequency    TEXT        NOT NULL DEFAULT '',
  timing       TEXT        NOT NULL DEFAULT '',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.medicines IS 'Master list of medicines used in OPD prescriptions';
COMMENT ON COLUMN public.medicines.brand_name  IS 'Auto-extracted brand name (text before first period)';
COMMENT ON COLUMN public.medicines.composition IS 'Auto-extracted composition/dosage (text after first period)';
COMMENT ON COLUMN public.medicines.form IS 'tablet | capsule | syrup | inhaler | respules | nasal_spray | transhaler | spacer | injection | other';

CREATE INDEX IF NOT EXISTS idx_medicines_name   ON public.medicines USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_medicines_brand  ON public.medicines (brand_name);
CREATE INDEX IF NOT EXISTS idx_medicines_active ON public.medicines (is_active);
