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
   * Sandboxes are activated on-demand via the dual-action floating capsule toolbar
   * (preview click or hover-charge) and maintained within the MAX_ACTIVE_SANDBOXES LRU pool.
   */
  warmup(_slugs: string[]) {
    // Kept as safe no-op for backward compatibility
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
