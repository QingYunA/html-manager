"use client";

import Link from "next/link";
import { Shield, Terminal, Globe, Cpu, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/context";

const ICONS = [Cpu, Shield, Globe, Terminal];

export default function AboutClient() {
  const { t } = useLanguage();
  const page = t.aboutPage;

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      {/* Intro */}
      <div className="space-y-4 mb-12">
        <Badge variant="outline" className="px-3 py-0.5 text-xs font-mono">
          {page.badge}
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {page.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {page.subtitle}
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid sm:grid-cols-2 gap-5 mb-14">
        {page.pillars.map((pillar, idx) => {
          const Icon = ICONS[idx] || Cpu;
          return (
            <div key={idx} className="p-5 rounded-xl border border-border bg-card/60 space-y-2.5">
              <div className="p-2 rounded-lg bg-muted w-fit text-foreground">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{pillar.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{pillar.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Community Callout */}
      <div className="p-6 sm:p-8 rounded-xl border border-border bg-card text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-foreground">{page.communityTitle}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {page.communityDesc}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs font-mono">
            <a
              href="https://github.com/QingYunA/html-manager"
              target="_blank"
              rel="noopener noreferrer"
            >
              {page.viewGitHub}
            </a>
          </Button>
          <Button size="sm" asChild className="h-8 text-xs gap-1.5">
            <Link href="/workspace/upload">
              <span>{page.startDeploy}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
