-- Add airtable_id column to positions table for sync tracking
ALTER TABLE public.positions
ADD COLUMN IF NOT EXISTS airtable_id TEXT;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS positions_airtable_id_idx ON public.positions(airtable_id);
