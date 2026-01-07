import { createClient } from '@supabase/supabase-js'

// 開発を優先するため、直接書き込みます
const supabaseUrl = "https://fpylnjqwswjttipnabjn.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweWxuanF3c3dqdHRpcG5hYmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NDk5ODUsImV4cCI6MjA4MzIyNTk4NX0.OD1GY8TjjfmunXZPEyW5GEWehNaQfBTIQ6mYHYKJW_A"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)