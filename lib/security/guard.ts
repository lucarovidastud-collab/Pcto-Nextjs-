import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/security/session";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function requireSession(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!checkRateLimit(`api:${ip}`)) {
    return {
      error: NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      session: null
    };
  }
  const session = await readSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null
    };
  }
  return { error: null, session };
}
