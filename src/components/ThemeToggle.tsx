"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Theme = "light" | "dark" | "system";

const themeIcons: Record<Theme, string> = {
  light: "☀️",
  dark: "🌙",
  system: "💻",
};

const themeLabels: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const THEME_KEY = "point-theme";
const VALID_THEMES: Theme[] = ["light", "dark", "system"];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    root.removeAttribute("data-theme");
  } else {
    // system
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && VALID_THEMES.includes(stored as Theme)) {
      return stored as Theme;
    }
  } catch {
    // ignore
  }
  return "system";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const themeRef = useRef<Theme>("system");

  // Read stored theme on mount — both setState calls are necessary to
  // hydrate client state from localStorage (not available during SSR)
  useEffect(() => {
    const stored = readStoredTheme();
    themeRef.current = stored;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading from localStorage on mount
    setMounted(true);
    setTheme(stored);
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    themeRef.current = theme;
  }, [theme, mounted]);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (themeRef.current === "system") {
        if (e.matches) {
          document.documentElement.setAttribute("data-theme", "dark");
        } else {
          document.documentElement.removeAttribute("data-theme");
        }
      }
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, mounted]);

  const cycle = useCallback(() => {
    const order: Theme[] = ["system", "light", "dark"];
    setTheme((prev) => {
      const next = order[(order.indexOf(prev) + 1) % order.length];
      return next;
    });
  }, []);

  // Prevent hydration mismatch: render placeholder until mounted
  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-background text-base hover:bg-muted transition-colors"
        aria-label="Toggle theme"
      >
        💻
      </button>
    );
  }

  return (
    <button
      onClick={cycle}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-background text-base hover:bg-muted transition-colors"
      aria-label={`Current theme: ${themeLabels[theme]}. Click to switch.`}
      title={`${themeLabels[theme]} mode — click to switch`}
    >
      {themeIcons[theme]}
    </button>
  );
}