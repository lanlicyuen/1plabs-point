"use client";

import { useI18n } from "./LanguageProvider";

export default function BoardIntro() {
  const { t } = useI18n();

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{t.board.title}</h1>
      <p className="text-muted-foreground text-sm mt-1">{t.board.description}</p>
    </div>
  );
}
