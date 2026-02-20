-- Fix Relationship for Interview Panel
ALTER TABLE public.interview_panel DROP CONSTRAINT IF EXISTS interview_panel_user_id_fkey;
ALTER TABLE public.interview_panel 
  ADD CONSTRAINT interview_panel_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
-- Fix Relationship for Team Members
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;
ALTER TABLE public.team_members 
  ADD CONSTRAINT team_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_invited_by_fkey;
ALTER TABLE public.team_members 
  ADD CONSTRAINT team_members_invited_by_fkey 
  FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
-- Fix Relationship for Comments
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE public.comments 
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;