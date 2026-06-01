import { NextResponse } from "next/server";
import { createAdminSessionToken } from "@/lib/security/admin-guard";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { email, password } = body || {};

  // Hardcoded super admin credentials (in production, use process.env)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "master@quotegen.it";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "MasterAdmin2026!";

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = await createAdminSessionToken({ role: "superadmin" });
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60, // 12 hours
      path: "/",
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Credenziali non valide." },
    { status: 401 }
  );
}
