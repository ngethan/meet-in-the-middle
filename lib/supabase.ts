import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sfjetsmyawrcpwiakezi.supabase.co/";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmamV0c215YXdyY3B3aWFrZXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMTA3MDQsImV4cCI6MjA1MzY4NjcwNH0.ahVoWtnC8rgtLrmCmw1kWDo4BXLlTgvk2UBujljQQpI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
