import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://akdryqadcxhzqcqhssok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZHJ5cWFkY3hoenFjcWhzc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg5MDQsImV4cCI6MjA2OTMwNDkwNH0.36poCyc_PGl2EnGM3283Hj5_yxRYQU2IetYl8aUA3r4';

export const SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    tables: {
        leads: 'leads',
        opportunities: 'opportunities',
        profiles: 'profiles',
        stageChangeLogs: 'stage_change_logs'
    }
};

// Create a single instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
