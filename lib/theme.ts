export type ThemeMode = "light" | "dark";

/** v2: reset preferenze obsolete che forzavano il tema scuro al login. */
export const THEME_STORAGE_KEY = "quotegen_theme_v2";

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}
