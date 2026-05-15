"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useI18n } from "./LanguageProvider";
import type { Language } from "@/lib/i18n";

const navItems = [
  { href: "/", labelKey: "board", icon: "🗂️" },
  { href: "/decisions", labelKey: "decisions", icon: "⚖️" },
  { href: "/progress", labelKey: "progress", icon: "📊" },
  { href: "/blockers", labelKey: "blockers", icon: "🚧" },
  { href: "/activity", labelKey: "activity", icon: "📋" },
] as const;

const languageOptions: Language[] = ["en", "zhHant"];

function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center rounded-md border border-border p-0.5 text-xs">
      {languageOptions.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          className={[
            "rounded px-2 py-1 transition-colors",
            language === option
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          ].join(" ")}
          aria-pressed={language === option}
        >
          {t.language[option]}
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-base">
            <span className="text-xl">📍</span>
            <span className="hidden sm:inline">1plabs Point</span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Nav */}
            <nav className="flex items-center gap-1">
              {navItems.map(({ href, labelKey, icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    <span className="text-base leading-none">{icon}</span>
                    <span className="hidden md:inline">{t.nav[labelKey]}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Theme toggle */}
            <div className="ml-2 flex items-center gap-2 border-l border-border pl-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
