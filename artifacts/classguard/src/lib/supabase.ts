import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://cjbyfyavdljggdtibwqu.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ibS36CDg1bT1PTm-zMjbCA_5FgLIktG";

// Main anon client — used for all teacher-side data queries (api.ts).
// persistSession: false so it never interferes with student auth.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? DEFAULT_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Student auth client — separate instance with session persistence enabled.
// Only used for student sign-in, sign-up, and RPC calls.
export const studentSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? DEFAULT_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: "cg-student-session",
    },
  },
);

// Teacher auth client — separate instance to avoid session collisions.
export const teacherSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? DEFAULT_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: "cg-teacher-session",
    },
  },
);
