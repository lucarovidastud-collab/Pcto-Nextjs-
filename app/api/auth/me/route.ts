import { NextResponse } from "next/server";
import { readSession } from "@/lib/security/session";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      role: session.role,
      tenantId: session.tenantId
    }
  });
}
