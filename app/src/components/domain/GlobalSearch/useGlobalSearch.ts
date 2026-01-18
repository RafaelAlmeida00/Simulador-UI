'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { simulatorStore } from '@/src/stores/simulatorStore';
import { buildSearchIndex, filterResults, groupResultsByCategory } from '@/src/utils/searchUtils';
import type { SearchIndex } from '@/src/types/search';
import { CATEGORY_ORDER } from '@/src/types/search';

export function useGlobalSearch(isOpen: boolean) {
  const [searchTerm, setSearchTerm] = useState('');

  // Build index during render (derived from isOpen state)
  const index = useMemo<SearchIndex | null>(() => {
    if (!isOpen) return null;
    const snapshot = simulatorStore.getSnapshot();
    return buildSearchIndex(snapshot);
  }, [isOpen]);

  // Track previous open state to reset search term when closing
  // This effect synchronizes component state with the dialog open/close lifecycle
  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      // Dialog just closed - reset search term for next open
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchTerm('');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Filter results based on search term
  const results = useMemo(() => {
    if (!index) return [];
    return filterResults(index, searchTerm);
  }, [index, searchTerm]);

  // Group results by category
  const groupedResults = useMemo(() => {
    return groupResultsByCategory(results);
  }, [results]);

  // Get non-empty categories in order (using constant from types)
  const activeCategories = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => groupedResults[cat]?.length > 0);
  }, [groupedResults]);

  return {
    searchTerm,
    setSearchTerm,
    results,
    groupedResults,
    activeCategories,
    isLoading: isOpen && !index,
    totalResults: results.length,
  };
}
