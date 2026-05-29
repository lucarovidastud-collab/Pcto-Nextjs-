import { z } from "zod";

export const analyzeSiteSchema = z.object({
  website: z.string().url(),
  notes: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  company: z.string().optional(),
  sector: z.string().optional()
});

export const createProposalSchema = z
  .object({
    company: z.string().min(2),
    website: z.string().url().or(z.literal("")),
    sector: z.string().min(2),
    notes: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    budget: z.number().int().positive().optional(),
    palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1).max(10)
  })
  .superRefine((value, ctx) => {
    const notes = (value.notes || "").trim();
    const hasNotes = notes.length >= 10;
    const hasSource = Boolean(value.sourceUrl);
    if (!hasNotes && !hasSource) {
      ctx.addIssue({ code: "custom", path: ["notes"], message: "notes o sourceUrl richiesti" });
    }
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(60)
});
