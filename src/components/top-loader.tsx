"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // When pathname or searchParams changes, finish the progress bar
  useEffect(() => {
    let hideTimer: NodeJS.Timeout | null = null;
    const frame = requestAnimationFrame(() => {
      setProgress(100);
      hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [pathname, searchParams]);

  // Intercept clicks on links that cause route navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external, target=_blank, hash, download, or modifier clicks
      if (
        target.target === "_blank" ||
        target.getAttribute("rel")?.includes("external") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // If navigating to the exact same URL, don't trigger loader
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      // Start loader
      if (timerRef.current) clearInterval(timerRef.current);
      setVisible(true);
      setProgress(25);

      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 60) return prev + Math.random() * 15;
          if (prev < 85) return prev + Math.random() * 5;
          return prev;
        });
      }, 150);
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[2px] w-full bg-transparent overflow-hidden"
    >
      <div
        className="h-full bg-foreground dark:bg-zinc-100 transition-all duration-200 ease-out shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_8px_rgba(255,255,255,0.2)]"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  );
}
