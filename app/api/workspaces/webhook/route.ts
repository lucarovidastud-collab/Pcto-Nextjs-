import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/guard";
import { getWorkspaceWebhookUrl, setWorkspaceWebhookUrl } from "@/lib/db/repositories";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const url = await getWorkspaceWebhookUrl(auth.session.tenantId);
  return NextResponse.json({ url });
}

const schema = z.object({ url: z.union([z.string().url().max(500), z.literal("")]) });

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  if (auth.session.role !== "owner" && auth.session.role !== "admin") {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "URL non valido" }, { status: 400 });
  await setWorkspaceWebhookUrl(auth.session.tenantId, parsed.data.url);
  return NextResponse.json({ ok: true });
}
