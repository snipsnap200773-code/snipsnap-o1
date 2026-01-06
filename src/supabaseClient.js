import { createClient } from '@supabase/supabase-js';

// Supabaseの管理画面から取得した値をここに入れます
const supabaseUrl = 'https://fpylnjqwswjttipnabjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweWxuanF3c3dqdHRpcG5hYmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NDk5ODUsImV4cCI6MjA4MzIyNTk4NX0.OD1GY8TjjfmunXZPEyW5GEWehNaQfBTIQ6mYHYKJW_A';

export const supabase = createClient(supabaseUrl, supabaseKey);