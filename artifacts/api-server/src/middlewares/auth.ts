import { Buffer } from "node:buffer";
import type { IncomingMessage } from "node:http";

export function authMiddleware(req: IncomingMessage): void {
  // Only protect teacher-related routes
  const url = req.url ?? "/";
  if (url.includes("/api/auth/login") || url.includes("/health") || url.includes("/student-mark")) {
     return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Administrator access required for this resource.");
  }
  
  const token = authHeader.slice(7);
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("binary"));
    if (!payload.username || payload.expires < Date.now()) {
      throw new Error("Session invalid or expired.");
    }
  } catch (err) {
    throw new Error("Unauthorized administrator session.");
  }
}
