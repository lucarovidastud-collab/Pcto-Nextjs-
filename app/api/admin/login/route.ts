import { NextResponse } from "next/server";
import { createAdminSessionToken } from "@/lib/security/admin-guard";
import { cookies } from "next/headers";

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD devono essere configurate come variabili d'ambiente.");
  }
  return { email, password };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { email, password } = body || {};

  let credentials: { email: string; password: string };
  try {
    credentials = getAdminCredentials();
  } catch {
    return NextResponse.json(
      { error: "Backoffice non configurato. Contatta l'amministratore di sistema." },
      { status: 503 }
    );
  }

  if (email === credentials.email && password === credentials.password) {
    const token = await createAdminSessionToken({ role: "superadmin" });

    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60,
      path: "/"
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Credenziali non valide." }, { status: 401 });
}
