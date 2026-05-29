import { NextResponse } from "next/server";
import { upsertUserFromFirebase } from "@/lib/db/repositories";
import { getAdminAuth } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";
import { createSessionToken, setSessionCookie } from "@/lib/security/session";
import { z } from "zod";

const schema = z.object({
  idToken: z.string().min(20)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token Firebase non valido" }, { status: 400 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(parsed.data.idToken);
    const profile = await upsertUserFromFirebase({
      uid: decoded.uid,
      email: decoded.email || "",
      displayName: decoded.name,
      photoURL: decoded.picture
    });

    const token = await createSessionToken({
      userId: profile.userId,
      tenantId: profile.tenantId,
      role: profile.role,
      email: profile.email
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        email: profile.email,
        role: profile.role,
        tenantId: profile.tenantId
      }
    });
    setSessionCookie(response, token);
    logger.info({ uid: profile.userId }, "auth.firebase.success");
    return response;
  } catch (error) {
    logger.error({ error }, "auth.firebase.failed");
    const message = error instanceof Error ? error.message : "Errore sconosciuto";
    if (message.includes("JWT_SECRET")) {
      return NextResponse.json({ error: "Server non configurato (JWT_SECRET mancante)" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Autenticazione Firebase fallita. Verifica Firebase Admin e domini autorizzati." },
      { status: 401 }
    );
  }
}
