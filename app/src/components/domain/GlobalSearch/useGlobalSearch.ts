'use client';

import { useState, useEffect, useMemo } from 'react';
import { simulatorStore } from '@/src/stores/simulatorStore';
import { buildSearchIndex, filterResults, groupResultsByCategory } from '@/src/utils/searchUtils';
import type { SearchIndex } from '@/src/types/search';
import { CATEGORY_ORDER } from '@/src/types/search';

export function useGlobalSearch(isOpen: boolean) {
  const [searchTerm, setSearchTerm] = useState('');
  const [index, setIndex] = useState<SearchIndex | null>(null);

  // Build index when dialog opens (snapshot approach)
  useEffect(() => {
    if (isOpen) {
      const snapshot = simulatorStore.getSnapshot();
      const newIndex = buildSearchIndex(snapshot);
      setIndex(newIndex);
    } else {
      // Reset on close
      setSearchTerm('');
      setIndex(null);
    }

    // Cleanup on unmount
    return () => {
      setSearchTerm('');
      setIndex(null);
    };
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
