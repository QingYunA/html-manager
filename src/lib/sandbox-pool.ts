"use client";

import { useSyncExternalStore } from "react";

/**
 * Maximum concurrent active sandboxes allowed across the app.
 * 6 iframes comfortably covers a full 2x3 visible grid without straining
 * system memory or triggering Chromium renderer process exhaustion.
 */
export const MAX_ACTIVE_SANDBOXES = 6;

let activeSlugs: string[] = [];
let warmupTimeouts: NodeJS.Timeout[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function clearWarmupTimeouts() {
  warmupTimeouts.forEach((t) => clearTimeout(t));
  warmupTimeouts = [];
}

export const sandboxPool = {
  activate(slug: string) {
    if (!slug) return;
    const index = activeSlugs.indexOf(slug);
    if (index !== -1) {
      // Already active: move to the end of the LRU queue (marked as most recently active)
      activeSlugs = [...activeSlugs.slice(0, index), ...activeSlugs.slice(index + 1), slug];
    } else {
      // New activation: evict oldest if at capacity
      if (activeSlugs.length >= MAX_ACTIVE_SANDBOXES) {
        activeSlugs = [...activeSlugs.slice(1), slug];
      } else {
        activeSlugs = [...activeSlugs, slug];
      }
    }
    emitChange();
  },

  deactivate(slug: string) {
    if (!slug) return;
    const next = activeSlugs.filter((s) => s !== slug);
    if (next.length !== activeSlugs.length) {
      activeSlugs = next;
      emitChange();
    }
  },

  /**
   * Pre-warm / pre-activate the first batch of visible items (up to MAX_ACTIVE_SANDBOXES).
   * Staggers activations by ~70ms so the browser compiler doesn't freeze on initial load.
   */
  warmup(slugs: string[], staggerMs = 70) {
    if (!slugs || slugs.length === 0) return;
    clearWarmupTimeouts();

    const targetSlugs = slugs.slice(0, MAX_ACTIVE_SANDBOXES);
    const toActivate = targetSlugs.filter((s) => !activeSlugs.includes(s));
    if (toActivate.length === 0) return;

    toActivate.forEach((slug, idx) => {
      if (idx === 0) {
        this.activate(slug);
      } else {
        const timeout = setTimeout(() => {
          this.activate(slug);
        }, idx * staggerMs);
        warmupTimeouts.push(timeout);
      }
    });
  },

  clear() {
    clearWarmupTimeouts();
    if (activeSlugs.length > 0) {
      activeSlugs = [];
      emitChange();
    }
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot() {
    return activeSlugs;
  },
};

/**
 * Hook to reactively observe whether a given slug has an active sandbox in the pool.
 */
export function useIsSandboxActive(slug: string): boolean {
  const slugs = useSyncExternalStore(
    sandboxPool.subscribe,
    sandboxPool.getSnapshot,
    () => []
  );
  return slugs.includes(slug);
}

/**
 * Hook to observe the total number of active sandboxes in the pool.
 */
export function useActiveSandboxCount(): number {
  const slugs = useSyncExternalStore(
    sandboxPool.subscribe,
    sandboxPool.getSnapshot,
    () => []
  );
  return slugs.length;
}
