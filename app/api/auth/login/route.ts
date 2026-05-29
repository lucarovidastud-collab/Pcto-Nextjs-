import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/security/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { email, password } = body || {};

  if (email === "admin@quotegen.local" && password === "admin12345") {
    const token = await createSessionToken({
      userId: "usr_demo",
      tenantId: "ten_demo",
      role: "owner",
      email: "admin@quotegen.local"
    });
    const response = NextResponse.json({
      ok: true,
      user: {
        email: "admin@quotegen.local",
        role: "owner",
        tenantId: "ten_demo"
      }
    });
    setSessionCookie(response, token);
    return response;
  }

  return NextResponse.json(
    { error: "Credenziali non valide. Per accedere in modalità demo usa: admin@quotegen.local / admin12345" },
    { status: 401 }
  );
}
