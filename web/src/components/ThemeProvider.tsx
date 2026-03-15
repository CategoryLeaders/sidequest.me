"use client";

/**
 * ThemeProvider — manages theme (default | indica | sativa) and
 * mode (light | dark | system) via data attributes on <html>.
 *
 * Persists to localStorage. Exposes context so any component
 * (e.g. PreferencesModal) can read/write theme state.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Theme = "default" | "indica" | "sativa";
export type Mode = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  mode: Mode;
  resolvedMode: "light" | "dark";
  setTheme: (t: Theme) => void;
  setMode: (m: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "default",
  mode: "system",
  resolvedMode: "light",
  setTheme: () => {},
  setMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyToDOM(theme: Theme, resolved: "light" | "dark") {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  html.setAttribute("data-mode", resolved);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("default");
  const [mode, setModeState] = useState<Mode>("system");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Init from localStorage
  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("sq-theme") as Theme) || "default";
    const savedMode = (localStorage.getItem("sq-mode") as Mode) || "system";
    setThemeState(savedTheme);
    setModeState(savedMode);

    const resolved = savedMode === "system" ? getSystemMode() : savedMode;
    setResolvedMode(resolved);
    applyToDOM(savedTheme, resolved);
    setMounted(true);
  }, []);

  // Listen for OS preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (mode === "system") {
        const resolved = getSystemMode();
        setResolvedMode(resolved);
        applyToDOM(theme, resolved);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, theme]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem("sq-theme", t);
      const resolved = mode === "system" ? getSystemMode() : mode;
      applyToDOM(t, resolved);
    },
    [mode]
  );

  const setMode = useCallback(
    (m: Mode) => {
      setModeState(m);
      localStorage.setItem("sq-mode", m);
      const resolved = m === "system" ? getSystemMode() : m;
      setResolvedMode(resolved);
      applyToDOM(theme, resolved);
    },
    [theme]
  );

  // Prevent flash — render children only after mount
  // (the CSS defaults handle the initial render)
  return (
    <ThemeContext.Provider
      value={{ theme, mode, resolvedMode, setTheme, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
