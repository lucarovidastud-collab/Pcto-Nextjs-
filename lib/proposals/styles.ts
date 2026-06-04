export type ProposalStyleId =
  | "moderno"
  | "elegante"
  | "minimal"
  | "audace"
  | "corporate"
  | "creativo"
  | "tech"
  | "caldo"
  | "lusso"
  | "editoriale";

export type ProposalStyle = {
  id: ProposalStyleId;
  /** Direzione di tono passata al modello AI (italiano). */
  promptHint: string;
};

export const PROPOSAL_STYLES: ProposalStyle[] = [
  { id: "moderno", promptHint: "Moderno: pulito e premium, gerarchia netta, spazi generosi, impatto contemporaneo." },
  { id: "elegante", promptHint: "Elegante: raffinato e sobrio, tono misurato, dettagli curati, eleganza formale." },
  { id: "minimal", promptHint: "Minimal: essenziale, pochissimi elementi, molto spazio, frasi brevi e dirette." },
  { id: "audace", promptHint: "Audace: deciso e sicuro, titoli forti, messaggi d'impatto, energia commerciale." },
  { id: "corporate", promptHint: "Corporate: formale e istituzionale, struttura rigorosa, linguaggio professionale e affidabile." },
  { id: "creativo", promptHint: "Creativo: dinamico e originale, tono fresco, narrazione coinvolgente e vivace." },
  { id: "tech", promptHint: "Tech: preciso e data-driven, tono ingegneristico, metriche, specifiche e numeri concreti." },
  { id: "caldo", promptHint: "Caldo: amichevole e umano, tono cordiale e rassicurante, vicinanza al cliente." },
  { id: "lusso", promptHint: "Lusso: esclusivo e premium, tono ricercato, percezione di alto valore e cura artigianale." },
  { id: "editoriale", promptHint: "Editoriale: stile magazine, narrazione fluida e paragrafi curati, ritmo di lettura piacevole." }
];

export const DEFAULT_PROPOSAL_STYLE: ProposalStyleId = "moderno";

const STYLE_IDS = new Set<string>(PROPOSAL_STYLES.map((style) => style.id));

export function isProposalStyleId(value: string): value is ProposalStyleId {
  return STYLE_IDS.has(value);
}

export function resolveProposalStyle(id?: string | null): ProposalStyle {
  const match = id && isProposalStyleId(id) ? PROPOSAL_STYLES.find((style) => style.id === id) : undefined;
  return match ?? PROPOSAL_STYLES[0];
}
