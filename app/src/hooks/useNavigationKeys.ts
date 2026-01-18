'use client';

import { useEffect, useLayoutEffect, useCallback, useRef } from 'react';

interface UseNavigationKeysOptions {
  /** Total items for horizontal navigation (e.g., lines.length) */
  horizontalCount: number;
  /** Total items for vertical navigation (e.g., shops.length) */
  verticalCount: number;
  /** Current horizontal index */
  horizontalIndex: number;
  /** Current vertical index */
  verticalIndex: number;
  /** Callback when horizontal navigation occurs */
  onHorizontalChange: (newIndex: number) => void;
  /** Callback when vertical navigation occurs */
  onVerticalChange: (newIndex: number) => void;
  /** Custom keys for horizontal navigation (defaults: ArrowLeft/A, ArrowRight/D) */
  horizontalKeys?: { prev: string[]; next: string[] };
  /** Custom keys for vertical navigation (defaults: ArrowUp/W, ArrowDown/S) */
  verticalKeys?: { prev: string[]; next: string[] };
  /** Enable/disable the hook */
  enabled?: boolean;
}

/**
 * Hook for keyboard navigation with wrap-around behavior.
 * Disables navigation when input fields are focused.
 *
 * Default keys:
 * - Horizontal: ArrowLeft/A (prev), ArrowRight/D (next)
 * - Vertical: ArrowUp/W (prev), ArrowDown/S (next)
 *
 * @example
 * useNavigationKeys({
 *   horizontalCount: lines.length,
 *   verticalCount: shops.length,
 *   horizontalIndex: lineIndex,
 *   verticalIndex: shopIndex,
 *   onHorizontalChange: handleLineChange,
 *   onVerticalChange: handleShopChange,
 * });
 */
// Default key configurations
const DEFAULT_HORIZONTAL_KEYS = {
  prev: ['ArrowLeft', 'a', 'A'],
  next: ['ArrowRight', 'd', 'D'],
};

const DEFAULT_VERTICAL_KEYS = {
  prev: ['ArrowUp', 'w', 'W'],
  next: ['ArrowDown', 's', 'S'],
};

/**
 * Calculate wrap-around index for navigation.
 */
export function wrapIndex(currentIndex: number, count: number, direction: 'prev' | 'next'): number {
  if (count <= 1) return currentIndex;
  if (direction === 'prev') {
    return currentIndex === 0 ? count - 1 : currentIndex - 1;
  }
  return currentIndex === count - 1 ? 0 : currentIndex + 1;
}

export function useNavigationKeys(options: UseNavigationKeysOptions): void {
  // Use ref to always have latest values without recreating handler
  const optionsRef = useRef({
    ...options,
    horizontalKeys: options.horizontalKeys ?? DEFAULT_HORIZONTAL_KEYS,
    verticalKeys: options.verticalKeys ?? DEFAULT_VERTICAL_KEYS,
    enabled: options.enabled ?? true,
  });

  // Update ref in layout effect to keep it synchronized with latest options
  useLayoutEffect(() => {
    optionsRef.current = {
      ...options,
      horizontalKeys: options.horizontalKeys ?? DEFAULT_HORIZONTAL_KEYS,
      verticalKeys: options.verticalKeys ?? DEFAULT_VERTICAL_KEYS,
      enabled: options.enabled ?? true,
    };
  });

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const {
      enabled,
      horizontalCount: hCount,
      verticalCount: vCount,
      horizontalIndex: hIndex,
      verticalIndex: vIndex,
      onHorizontalChange: hChange,
      onVerticalChange: vChange,
      horizontalKeys,
      verticalKeys,
    } = optionsRef.current;

    // Skip if disabled
    if (!enabled) return;

    // Disable navigation when typing in input fields
    const target = event.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable ||
      target.getAttribute('role') === 'textbox' ||
      target.getAttribute('role') === 'searchbox';

    if (isInputField) return;

    const { key } = event;

    // Guard against invalid counts
    if (hCount <= 0 || vCount <= 0) return;

    // Horizontal navigation (lines)
    if (horizontalKeys!.prev.includes(key)) {
      if (hCount <= 1) return;
      event.preventDefault();
      hChange(wrapIndex(hIndex, hCount, 'prev'));
    } else if (horizontalKeys!.next.includes(key)) {
      if (hCount <= 1) return;
      event.preventDefault();
      hChange(wrapIndex(hIndex, hCount, 'next'));
    }
    // Vertical navigation (shops)
    else if (verticalKeys!.prev.includes(key)) {
      if (vCount <= 1) return;
      event.preventDefault();
      vChange(wrapIndex(vIndex, vCount, 'prev'));
    } else if (verticalKeys!.next.includes(key)) {
      if (vCount <= 1) return;
      event.preventDefault();
      vChange(wrapIndex(vIndex, vCount, 'next'));
    }
  }, []); // Empty deps - all values read from ref

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
