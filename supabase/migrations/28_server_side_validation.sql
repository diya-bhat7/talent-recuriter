-- ============================================
-- 28. SERVER-SIDE VALIDATION (PUBLIC FORMS)
-- ============================================
-- This migration adds database-level constraints and triggers 
-- to validate public candidate submissions.

-- 1. Add constraints to candidates table
ALTER TABLE public.candidates 
ADD CONSTRAINT candidates_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
ADD CONSTRAINT candidates_name_length CHECK (char_length(name) <= 100),
ADD CONSTRAINT candidates_phone_length CHECK (char_length(phone) <= 30),
ADD CONSTRAINT candidates_linkedin_url_length CHECK (char_length(linkedin_url) <= 255);

-- 2. Create sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_input() 
RETURNS TRIGGER AS $$
BEGIN
    -- Strip potential XSS substrings from notes/content
    -- This is a basic safeguard, real sanitization should happen in Edge/App layer too
    IF NEW.notes IS NOT NULL THEN
        NEW.notes := REGEXP_REPLACE(NEW.notes, '<[^>]*>', '', 'g');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply sanitization trigger
DROP TRIGGER IF EXISTS trg_candidates_sanitize ON public.candidates;
CREATE TRIGGER trg_candidates_sanitize
BEFORE INSERT OR UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.sanitize_input();

-- 4. Add constraints to submissions table
ALTER TABLE public.submissions
ADD CONSTRAINT submissions_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
ADD CONSTRAINT submissions_name_length CHECK (char_length(name) <= 100);
