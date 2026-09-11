"use client";

import Link from "next/link";
import { Check, Shield, Sparkles, Zap, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/context";

export default function PricingClient() {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 md:py-16">
      {/* Header Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <Badge variant="outline" className="px-3 py-0.5 text-xs font-mono tracking-wide">
          {t.pricing.badge}
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {t.pricing.title}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.pricing.desc}
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20 items-stretch">
        {/* Free Starter Plan */}
        <div className="relative flex flex-col p-6 sm:p-8 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="mb-6">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {t.pricing.freePlan.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">
              {t.pricing.freePlan.desc}
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {t.pricing.freePlan.price}
              </span>
              <span className="text-xs text-muted-foreground">
                {t.pricing.freePlan.period}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-6 mb-8 flex-1">
            <ul className="space-y-3 text-xs text-muted-foreground">
              {t.pricing.freePlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button variant="outline" asChild className="w-full h-10 text-xs font-medium border-border hover:bg-muted">
            <Link href="/workspace/upload">
              {t.pricing.freePlan.cta}
            </Link>
          </Button>
        </div>

        {/* Pro Cloud Plan */}
        <div className="relative flex flex-col p-6 sm:p-8 rounded-xl border-2 border-foreground bg-card text-card-foreground shadow-md">
          <div className="absolute -top-3 right-6">
            <Badge className="bg-foreground text-background hover:bg-foreground px-2.5 py-0.5 text-[11px] font-medium tracking-wide">
              {t.pricing.proPlan.badge}
            </Badge>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {t.pricing.proPlan.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">
              {t.pricing.proPlan.desc}
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {t.pricing.proPlan.price}
              </span>
              <span className="text-xs text-muted-foreground">
                {t.pricing.proPlan.period}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-6 mb-8 flex-1">
            <ul className="space-y-3 text-xs text-muted-foreground">
              {t.pricing.proPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/90 font-medium">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button asChild className="w-full h-10 text-xs font-medium gap-1.5 shadow-sm">
            <Link href="/workspace/upload">
              <span>{t.pricing.proPlan.cta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* High-Value SEO FAQ Accordion Section */}
      <div className="max-w-3xl mx-auto pt-6 border-t border-border">
        <div className="text-center mb-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {t.pricing.faqTitle}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t.pricing.faqDesc}
          </p>
        </div>

        <div className="space-y-4">
          {t.pricing.faqs.map((faq, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border bg-card/60 space-y-2 hover:border-foreground/30 transition-colors"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-xs">Q{index + 1}.</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
