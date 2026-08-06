import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "menu-images";
export const MENU_ID = import.meta.env.VITE_MENU_ID || "main";
export const isCloudConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isCloudConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

