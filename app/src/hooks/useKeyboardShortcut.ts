'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardModifiers {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}

/**
 * Hook for detecting keyboard shortcuts
 * Supports both Ctrl (Windows/Linux) and Meta/Cmd (Mac) modifiers
 *
 * @param key - The key to detect (case-insensitive)
 * @param callback - Function to call when shortcut is triggered
 * @param modifiers - Optional modifiers (ctrl, meta, shift, alt)
 *
 * @example
 * // Ctrl+K or Cmd+K to open search
 * useKeyboardShortcut('k', () => setOpen(true), { ctrl: true, meta: true });
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: KeyboardModifiers = {}
): void {
  // Destructure to get primitive values for stable dependencies
  const { ctrl, meta, shift, alt } = modifiers;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if key matches (case-insensitive)
      if (event.key.toLowerCase() !== key.toLowerCase()) {
        return;
      }

      // Check modifiers
      // If ctrl or meta is specified as true, at least one of them must be pressed
      const ctrlOrMeta = ctrl || meta;
      if (ctrlOrMeta) {
        if (!event.ctrlKey && !event.metaKey) {
          return;
        }
      }

      // Check shift modifier
      if (shift && !event.shiftKey) {
        return;
      }

      // Check alt modifier
      if (alt && !event.altKey) {
        return;
      }

      // Prevent default behavior (e.g., browser search)
      event.preventDefault();
      callback();
    },
    [key, callback, ctrl, meta, shift, alt]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
