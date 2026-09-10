"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/i18n/context";
import { Plus, User, LogOut } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { logoutAdmin } from "@/app/actions/auth";

interface HomeHeaderProps {
  currentUser: CurrentUser | null;
}

export function HomeHeader({ currentUser }: HomeHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-xs px-4 sm:px-8 h-12 flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-sm text-foreground">
            <div className="w-5 h-5 rounded-md bg-foreground text-background flex items-center justify-center font-mono text-[11px] font-bold">
              P
            </div>
            <span>Pagepod</span>
          </Link>
          <span className="text-border">/</span>
          <span className="text-xs text-muted-foreground font-mono">{t.nav.showcase}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* GitHub Repo Link */}
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground hover:text-foreground">
            <a href="https://github.com/QingYunA/html-manager" target="_blank" rel="noopener noreferrer">
              <svg className="w-3.5 h-3.5 mr-1 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>

          {/* Language & Theme switchers */}
          <LanguageToggle />
          <ThemeToggle />

          {/* Dynamic Login / User Status */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
                <Link href="/admin">
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[90px] sm:max-w-none truncate">{currentUser.email || t.nav.console}</span>
                </Link>
              </Button>
              <form action={logoutAdmin}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title={t.nav.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-medium">
                <Link href="/admin/login">{t.nav.login}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="h-8 text-xs font-medium">
                <Link href="/admin/login?tab=signup">{t.nav.signup}</Link>
              </Button>
            </div>
          )}

          <Button size="sm" asChild className="h-8 text-xs font-medium">
            <Link href="/admin/upload">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>{t.nav.publish}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
