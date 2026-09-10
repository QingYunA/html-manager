"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/context";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-border/60 py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-mono font-normal">
            {t.hero.badge}
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {t.hero.title}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {t.hero.desc}
        </p>
      </div>
    </section>
  );
}
