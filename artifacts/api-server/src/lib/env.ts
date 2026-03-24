const DEFAULT_SUPABASE_URL = "https://cjbyfyavdljggdtibwqu.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ibS36CDg1bT1PTm-zMjbCA_5FgLIktG";

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }

  return value;
}

export const env = {
  corsOrigin: process.env["CORS_ORIGIN"] ?? "*",
  supabaseUrl: readEnv("SUPABASE_URL", DEFAULT_SUPABASE_URL),
  supabasePublishableKey: readEnv(
    "SUPABASE_PUBLISHABLE_KEY",
    DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  ),
  supabaseServiceRoleKey: process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? null,
};
