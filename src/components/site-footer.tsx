"use client";

import { ShieldCheck, Terminal, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/80 py-6 px-4 sm:px-8 text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> {t.footer.sandboxGuaranteed}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-sky-400" /> {t.footer.apiPush}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> {t.footer.e2eeReady}
          </span>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground">
          {t.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
