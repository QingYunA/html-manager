"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Terminal, Globe, Cpu, ArrowRight, Mail, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/context";

const ICONS = [Cpu, Shield, Globe, Terminal];

export default function AboutClient() {
  const { t } = useLanguage();
  const page = t.aboutPage;
  const [copied, setCopied] = useState(false);

  const contactEmail = "contact@pagepod.dev";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      {/* Intro */}
      <div className="space-y-4 mb-12">
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

      {/* Contact & Support Section */}
      <div className="mt-8 p-6 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-sm font-semibold text-foreground flex items-center justify-center sm:justify-start gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{page.contactTitle}</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            {page.contactDesc}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyEmail}
            className="h-8 text-xs font-mono gap-1.5"
            title={page.copyEmail}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{contactEmail}</span>
          </Button>
          <Button size="sm" asChild className="h-8 text-xs gap-1.5">
            <a href={`mailto:${contactEmail}`}>
              <Mail className="w-3.5 h-3.5" />
              <span>{page.contactButton}</span>
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
