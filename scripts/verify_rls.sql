-- RLS Verification Script
-- Run this in the Supabase SQL Editor to find unprotected tables.

SELECT 
    schemaname, 
    tablename, 
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS DISABLED' END AS rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;
