import { describe, expect, it } from "vitest";
import { isValidProposalSlug, slugifyProposalLink } from "@/lib/proposals/slug";

describe("slugifyProposalLink", () => {
  it("normalizes company names", () => {
    expect(slugifyProposalLink("King Inox S.r.l.")).toBe("king-inox");
    expect(slugifyProposalLink("  Café Roma  ")).toBe("cafe-roma");
  });

  it("rejects reserved paths", () => {
    expect(isValidProposalSlug("admin")).toBe(false);
    expect(isValidProposalSlug("king-inox")).toBe(true);
  });
});
