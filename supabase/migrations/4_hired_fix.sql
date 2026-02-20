-- 1. Add missing column to positions and initialize
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS hired_count INTEGER DEFAULT 0;
UPDATE public.positions SET hired_count = 0 WHERE hired_count IS NULL;

-- 2. Add Hired Candidate logic
CREATE OR REPLACE FUNCTION public.handle_candidate_hired()
RETURNS TRIGGER AS $$
DECLARE
  target_roles INT;
  current_hired INT;
BEGIN
  -- COALESCE to handle NEW rows or null statuses
  IF COALESCE(OLD.status, 'new') IS DISTINCT FROM 'hired' AND NEW.status = 'hired' THEN
    UPDATE public.positions
    SET hired_count = COALESCE(hired_count, 0) + 1
    WHERE id = NEW.position_id
    RETURNING num_roles, hired_count INTO target_roles, current_hired;
    
    IF current_hired >= target_roles THEN
      UPDATE public.positions SET status = 'closed' WHERE id = NEW.position_id;
    END IF;
  ELSIF OLD.status = 'hired' AND NEW.status IS DISTINCT FROM 'hired' THEN
    UPDATE public.positions
    SET hired_count = greatest(0, COALESCE(hired_count, 0) - 1)
    WHERE id = NEW.position_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS on_candidate_hired ON public.candidates;
CREATE TRIGGER on_candidate_hired
AFTER UPDATE OF status ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.handle_candidate_hired();
