"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 font-mono cursor-pointer shrink-0"
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      title={locale === "zh" ? "Switch to English" : "切换为中文"}
    >
      <Languages className="w-3.5 h-3.5" />
      <span>{locale === "zh" ? "EN" : "中"}</span>
    </Button>
  );
}
