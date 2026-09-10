"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/context";
import { logoutAdmin } from "@/app/actions/auth";
import type { CurrentUser } from "@/lib/auth";
import {
  LayoutDashboard,
  Key,
  Plus,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

interface UserDropdownProps {
  currentUser: CurrentUser;
}

export function UserDropdown({ currentUser }: UserDropdownProps) {
  const { t } = useLanguage();

  const displayName =
    currentUser.fullName ||
    currentUser.email?.split("@")[0] ||
    (currentUser.role === "admin" ? "Admin" : "User");

  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-1.5 sm:px-2 rounded-full border border-border/60 hover:bg-muted/70 transition-colors data-[state=open]:bg-muted"
        >
          {/* Avatar / Initial badge */}
          <div className="w-5.5 h-5.5 rounded-full overflow-hidden flex items-center justify-center bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-semibold tracking-tighter shrink-0 border border-border">
            {currentUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initialLetter}</span>
            )}
          </div>

          <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline-block">
            {displayName}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground opacity-70 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" sideOffset={6}>
        {/* User Identity Header */}
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground truncate">
                {displayName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-muted text-muted-foreground uppercase">
                {currentUser.role}
              </span>
            </div>
            {currentUser.email && (
              <p className="text-[11px] text-muted-foreground truncate">
                {currentUser.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Primary Shortcuts */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer gap-2">
              <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t.nav.workspace}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/admin/upload" className="cursor-pointer gap-2">
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t.nav.publish}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/admin/settings/tokens" className="cursor-pointer gap-2">
              <Key className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t.nav.apiTokens}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* External & Public Hub */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/api/docs" target="_blank" className="cursor-pointer gap-2">
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              <span>OpenAPI 文档</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Sign Out Action */}
        <form action={logoutAdmin} className="w-full">
          <button type="submit" className="w-full">
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 w-full">
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.nav.logout}</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
