import { createClient } from '@supabase/supabase-js'

// Hardcoded for now to get your build passing immediately
const supabaseUrl = "https://xrjhsfwjdrwgdsvpghwp.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyamhzZndqZHJ3Z2RzdnBnaHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjEzMTMsImV4cCI6MjA4OTQ5NzMxM30.S0MqR5ayqko6ZM-zPBu0JsRKNDtLw_x3pIbl2McZkEY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)