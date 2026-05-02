export const GPM_CONSOLE_THEME_KEY = "gpm-console-theme";

export type GpmConsoleThemeMode = "dark" | "light";

const LEGACY_CLASS_LIGHT = "light";

/** Default when nothing stored yet (matches Settings default). */
const DEFAULT_THEME: GpmConsoleThemeMode = "dark";

export function readStoredThemeMode(): GpmConsoleThemeMode {
  try {
    const raw = localStorage.getItem(GPM_CONSOLE_THEME_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function syncDocumentTheme(mode: GpmConsoleThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.classList.toggle(LEGACY_CLASS_LIGHT, mode === "light");
}
