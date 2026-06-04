export const PALETTE_CHANNEL = "quotegen-palette";

export type PaletteMessage = { token: string; palette: string[] };

export function paletteStorageKey(token: string) {
  return `quotegen:palette:${token}`;
}

/** Notifica le pagine preventivo già aperte (stesso browser) del cambio palette. */
export function broadcastPalette(token: string, palette: string[]) {
  if (!token || typeof window === "undefined") return;
  const message: PaletteMessage = { token, palette };
  try {
    const channel = new BroadcastChannel(PALETTE_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // BroadcastChannel non supportato: il fallback storage copre comunque le altre tab
  }
  try {
    localStorage.setItem(paletteStorageKey(token), JSON.stringify({ palette, ts: Date.now() }));
  } catch {
    // storage non disponibile (private mode): ignora
  }
}
