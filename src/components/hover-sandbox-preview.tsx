"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Play, Sparkles, Loader2, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsSandboxActive, sandboxPool } from "@/lib/sandbox-pool";

interface HoverSandboxPreviewProps {
  slug: string;
  title: string;
  category?: string;
  openRunnerText?: string;
  variant?: "card" | "table-cell";
  icon?: React.ComponentType<{ className?: string }>;
}

const CHARGE_DURATION_MS = 650;
const CARD_RADIUS = 16;
const CARD_CIRCUMFERENCE = 2 * Math.PI * CARD_RADIUS; // ~100.53

const CELL_RADIUS = 9;
const CELL_CIRCUMFERENCE = 2 * Math.PI * CELL_RADIUS; // ~56.55

export default function HoverSandboxPreview({
  slug,
  title,
  openRunnerText = "在线运行",
  variant = "card",
  icon: CustomIcon,
}: HoverSandboxPreviewProps) {
  const isPoolActive = useIsSandboxActive(slug);
  const [isCharging, setIsCharging] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // For table-cell floating popover: tracks active popover locally so it doesn't overlap forever
  const [isCellActive, setIsCellActive] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const isOverPopoverRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearChargeTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updatePopoverPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 170;
    const popoverWidth = 288;

    const top = rect.top > popoverHeight + 16 ? rect.top - popoverHeight - 8 : rect.bottom + 8;
    const left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, rect.left));
    setPopoverPos({ top, left });
  };

  const handleMouseEnter = () => {
    if (variant === "card") {
      if (isPoolActive) return;
    } else {
      if (isCellActive) return;
    }

    updatePopoverPosition();
    setIsCharging(true);
    clearChargeTimer();

    timerRef.current = setTimeout(() => {
      setIsCharging(false);
      if (variant === "card") {
        // Enqueue into persistent global pool (max 6)
        sandboxPool.activate(slug);
      } else {
        setIsCellActive(true);
      }
    }, CHARGE_DURATION_MS);
  };

  const handleMouseLeave = () => {
    clearChargeTimer();
    setIsCharging(false);

    if (variant === "table-cell") {
      setTimeout(() => {
        if (!isOverPopoverRef.current) {
          setIsCellActive(false);
          setIframeLoaded(false);
        }
      }, 50);
    }
    // In "card" mode: do NOT deactivate! The card remains active in the pool.
  };

  const handleManualClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (variant === "card") {
      sandboxPool.deactivate(slug);
    } else {
      setIsCellActive(false);
    }
    setIframeLoaded(false);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearChargeTimer();
    };
  }, [clearChargeTimer]);

  const isCardActive = variant === "card" && isPoolActive;

  /* ----------------------------------------------------
   * VARIANT 1: TABLE CELL (For Admin Table Row Previews)
   * ---------------------------------------------------- */
  if (variant === "table-cell") {
    const DisplayIcon = CustomIcon || Play;

    return (
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-14 aspect-video rounded overflow-hidden bg-neutral-900/90 border border-border/80 shrink-0 relative flex items-center justify-center cursor-pointer select-none group/cell shadow-2xs hover:border-neutral-500 transition-colors"
      >
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-neutral-950/40" />

        {/* Mini Progress Circle */}
        <svg
          className="w-7 h-7 -rotate-90 transform absolute"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r={CELL_RADIUS}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="2"
            className="text-neutral-800"
          />
          <circle
            cx="12"
            cy="12"
            r={CELL_RADIUS}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={CELL_CIRCUMFERENCE}
            strokeDashoffset={isCharging || isCellActive ? 0 : CELL_CIRCUMFERENCE}
            strokeLinecap="round"
            className="text-neutral-200 transition-all"
            style={{
              transitionDuration: isCharging ? `${CHARGE_DURATION_MS}ms` : "150ms",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>

        {/* Center Icon */}
        <div className="relative z-10 text-neutral-400 group-hover/cell:text-neutral-200 transition-colors">
          <DisplayIcon className="w-3.5 h-3.5" />
        </div>

        {/* Direct Click -> Open Runner */}
        <Link
          href={`/p/${slug}`}
          target="_blank"
          className="absolute inset-0 z-20"
          title={`点击直接打开 ${title}`}
        />

        {/* Floating Sandboxed Preview Popover */}
        {isCellActive && mounted && typeof document !== "undefined" && createPortal(
          <div
            onMouseEnter={() => {
              isOverPopoverRef.current = true;
            }}
            onMouseLeave={() => {
              isOverPopoverRef.current = false;
              setIsCellActive(false);
              setIframeLoaded(false);
            }}
            style={{ top: popoverPos.top, left: popoverPos.left }}
            className="fixed z-[9999] w-72 aspect-video bg-neutral-950 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <iframe
              src={`/raw/${slug}`}
              title={title}
              tabIndex={-1}
              sandbox="allow-scripts"
              onLoad={() => setIframeLoaded(true)}
              className={`w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none select-none bg-white transition-opacity duration-300 ${
                iframeLoaded ? "opacity-100" : "opacity-0"
              }`}
            />

            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-neutral-950/90 text-neutral-400">
                {/* 2px hairline indeterminate loader across the top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden bg-neutral-900 z-30 pointer-events-none">
                  <div className="h-full bg-neutral-200/90 animate-pulse w-full" />
                </div>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-300" />
                <span className="text-[10px] font-mono">加载实时沙箱中...</span>
              </div>
            )}

            {/* Status Pill */}
            <div className="absolute top-2 left-2 pointer-events-none z-20">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium bg-black/80 text-emerald-400 border border-emerald-500/30 shadow-xs">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                <span>沙箱运行中</span>
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={handleManualClose}
              title="关闭预览"
              className="absolute top-2 right-2 p-1 rounded-full bg-black/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors z-30"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Quick Open Button */}
            <Link
              href={`/p/${slug}`}
              target="_blank"
              className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-black/80 hover:bg-neutral-900 text-neutral-200 hover:text-white text-[10px] font-medium border border-neutral-700 backdrop-blur-md transition-colors z-20"
            >
              <span>{openRunnerText}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>,
          document.body
        )}
      </div>
    );
  }

  /* ----------------------------------------------------
   * VARIANT 2: FULL CARD (For Showcase & Workspace Grid)
   * Stays active in global LRU pool (up to 6 concurrent).
   * ---------------------------------------------------- */
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative aspect-video w-full bg-neutral-950 dark:bg-[#09090b] border-b border-border/60 overflow-hidden select-none group/sandbox"
    >
      {/* 1. Active Sandboxed iframe (Persisted in pool across mouse movements) */}
      {isCardActive && (
        <>
          <iframe
            src={`/raw/${slug}`}
            title={title}
            tabIndex={-1}
            sandbox="allow-scripts"
            onLoad={() => setIframeLoaded(true)}
            className={`w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none select-none bg-white transition-opacity duration-300 ${
              iframeLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Loading indicator while active iframe is compiling */}
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-950/80 backdrop-blur-xs text-neutral-400">
              {/* 2px hairline indeterminate loader across the top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden bg-neutral-900 z-30 pointer-events-none">
                <div className="h-full bg-neutral-200/90 animate-pulse w-full" />
              </div>
              <Loader2 className="w-5 h-5 animate-spin text-neutral-300" />
              <span className="text-[11px] font-mono tracking-tight">启动沙箱环境中...</span>
            </div>
          )}

          {/* Live Indicator Pill & Close Button */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-black/75 text-emerald-400 border border-emerald-500/30 backdrop-blur-md shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>沙箱运行中</span>
            </span>

            {/* Optional Manual Close / Release Button */}
            <button
              onClick={handleManualClose}
              title="暂停沙箱以释放资源"
              className="p-1 rounded-full bg-black/75 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700/80 backdrop-blur-md transition-colors cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </>
      )}

      {/* 2. Idle & Charging Technical Poster */}
      {!isCardActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-neutral-950 dark:bg-[#070709] transition-colors">
          {/* Subtle Hairline Blueprint Grid Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #71717a 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Circular Progress Ring with Play Indicator */}
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg
              className="w-11 h-11 -rotate-90 transform"
              viewBox="0 0 40 40"
              aria-hidden="true"
            >
              {/* Background Track Circle */}
              <circle
                cx="20"
                cy="20"
                r={CARD_RADIUS}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-neutral-800"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="20"
                cy="20"
                r={CARD_RADIUS}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={CARD_CIRCUMFERENCE}
                strokeDashoffset={isCharging ? 0 : CARD_CIRCUMFERENCE}
                strokeLinecap="round"
                className="text-neutral-200 transition-all"
                style={{
                  transitionDuration: isCharging ? `${CHARGE_DURATION_MS}ms` : "150ms",
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </svg>

            {/* Inner Play/Preview Icon */}
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400 group-hover/sandbox:text-neutral-100 transition-colors">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </div>

          {/* Text Instruction */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 tracking-tight z-10">
            {isCharging ? (
              <span className="text-neutral-200 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-neutral-400 animate-pulse" />
                正在载入沙箱...
              </span>
            ) : (
              <span className="text-neutral-500 group-hover/sandbox:text-neutral-300 transition-colors">
                悬停以激活预览
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Direct Click Overlay -> Jump straight into full Runner */}
      <Link
        href={`/p/${slug}`}
        className="absolute inset-0 bg-black/40 opacity-0 group-hover/sandbox:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px] z-10"
        title={openRunnerText}
      >
        <Button
          size="sm"
          variant="secondary"
          className="h-7.5 px-3 text-xs gap-1.5 shadow-md pointer-events-none font-medium bg-neutral-900/90 text-neutral-100 border border-neutral-700 hover:bg-neutral-800"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{openRunnerText}</span>
        </Button>
      </Link>
    </div>
  );
}
