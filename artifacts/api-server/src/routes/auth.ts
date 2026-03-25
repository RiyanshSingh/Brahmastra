import { supabase } from "../lib/supabase";
import type { RouteDefinition } from "../lib/http";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const authRoutes: RouteDefinition[] = [
  {
    method: "POST",
    path: "/auth/login",
    handler: async (req, res) => {
      const { username, password } = loginSchema.parse(req.body);

      const { data, error } = await supabase
        .from("admin_auth")
        .select("*")
        .eq("username", username)
        .eq("password_plaintext", password)
        .maybeSingle();

      if (error || !data) {
        throw new Error("Invalid credentials.");
      }

      // Generate a simple session token (base64 encoded for this demo)
      const token = Buffer.from(JSON.stringify({ 
        id: data.id, 
        username: data.username, 
        expires: Date.now() + 1000 * 60 * 60  // 1 hour
      })).toString("base64");

      res.json({ token, user: { username: data.username } });
    },
  },
];

export default authRoutes;
