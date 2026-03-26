import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cjbyfyavdljggdtibwqu.supabase.co";
const supabaseKey = "sb_publishable_ibS36CDg1bT1PTm-zMjbCA_5FgLIktG";
const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log("Creating teacher account...");
  const { data, error } = await supabase.auth.signUp({
    email: "riyansh@brahmastra.internal",
    password: "Riyansh@2928",
  });

  if (error) {
    // If user already exists, we ignore and try to create profile
    if (error.message.includes("already registered")) {
        console.log("User already exists in auth.users, checking profile...");
        // find user id if possible
    } else {
        console.error("Sign up error:", error.message);
        return;
    }
  }

  const userId = data.user?.id;
  if (!userId) {
     console.error("User ID not found. Verify if confirmation is required.");
     return;
  }

  const { error: profileError } = await supabase
    .from('teacher_profiles')
    .insert({
      auth_user_id: userId,
      username: "Riyansh",
      full_name: "Riyansh Singh"
    });

  if (profileError) {
    if (profileError.message.includes("duplicate key")) {
        console.log("Profile already exists.");
    } else {
        console.error("Profile error:", profileError.message);
    }
  } else {
    console.log("Teacher profile created successfully!");
  }
}

setup();
