-- Composite index for candidate filtering via positions
-- Note: candidates table links to company via positions(id)
CREATE INDEX IF NOT EXISTS idx_candidates_position_status ON candidates(position_id, status);

-- Composite index for interview scheduling and filtering
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_status ON interviews(scheduled_at, status);

-- Index for position company lookups
CREATE INDEX IF NOT EXISTS idx_positions_company_id ON positions(company_id);
