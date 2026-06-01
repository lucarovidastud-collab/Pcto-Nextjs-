import { NextRequest, NextResponse } from "next/server";
import { isShareTokenTaken } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";
import { isValidProposalSlug, proposalSlugError, slugifyProposalLink } from "@/lib/proposals/slug";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const raw = request.nextUrl.searchParams.get("slug") || "";
  const slug = slugifyProposalLink(raw);

  const validationError = proposalSlugError(slug);
  if (validationError) {
    return NextResponse.json({ slug, available: false, error: validationError });
  }

  const taken = await isShareTokenTaken(slug);
  return NextResponse.json({
    slug,
    available: !taken,
    error: taken ? "Questo link è già in uso. Scegli un altro identificativo." : null
  });
}
