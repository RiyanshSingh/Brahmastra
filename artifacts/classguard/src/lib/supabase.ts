import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://cjbyfyavdljggdtibwqu.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ibS36CDg1bT1PTm-zMjbCA_5FgLIktG";

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
