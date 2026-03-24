-- ============================================
-- 38. CLEANUP STUCK INVITATIONS
-- ============================================

-- Replace 'FAILED_EMAIL@EXAMPLE.COM' with the email that didn't receive the mail

-- 1. Remove from Public Interviews
DELETE FROM public.interviews 
WHERE candidate_id IN (
    SELECT id FROM public.candidates 
    WHERE email = 'FAILED_EMAIL@EXAMPLE.COM'
);

-- 2. Remove from Public Candidates
DELETE FROM public.candidates 
WHERE email = 'FAILED_EMAIL@EXAMPLE.COM';

-- 3. NOTE: To remove from auth.users (Supabase Auth Dashboard), 
-- you must manually delete the user from the "Authentication" tab 
-- in the Supabase Dashboard if they are stuck in "Waiting for confirmation".

