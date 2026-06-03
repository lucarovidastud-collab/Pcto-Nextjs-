import { describe, expect, it } from "vitest";
import { formatReadableText } from "@/lib/utils/text";

describe("formatReadableText", () => {
  it("inserts space between lowercase and following uppercase", () => {
    expect(formatReadableText("SupportareKing Inoxnel settore")).toBe(
      "Supportare King Inoxnel settore"
    );
  });
});
