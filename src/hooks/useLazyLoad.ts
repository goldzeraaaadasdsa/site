/**
 * Custom hook for lazy loading data when tabs are activated
 * Only fetches data when a tab is first clicked
 * Caches data to avoid refetching
 */

import { useCallback, useRef, useEffect, useState } from 'react';

interface LazyLoadCache {
  [key: string]: {
    data: any;
    loading: boolean;
    error: Error | null;
  };
}

export const useLazyLoad = () => {
  const cacheRef = useRef<LazyLoadCache>({});
  const [cache, setCache] = useState<LazyLoadCache>({});

  const loadData = useCallback(async (
    tabId: string,
    endpoint: string,
    onSuccess: (data: any) => void
  ) => {
    // Return if already cached
    if (cacheRef.current[tabId]?.data) {
      onSuccess(cacheRef.current[tabId].data);
      return;
    }

    // Mark as loading
    const updatedCache = {
      ...cacheRef.current,
      [tabId]: {
        data: null,
        loading: true,
        error: null,
      },
    };
    cacheRef.current = updatedCache;
    setCache(updatedCache);

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${tabId}`);
      }

      const data = await response.json();

      // Update cache with fetched data
      const finalCache = {
        ...cacheRef.current,
        [tabId]: {
          data,
          loading: false,
          error: null,
        },
      };
      cacheRef.current = finalCache;
      setCache(finalCache);

      onSuccess(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');

      // Update cache with error
      const errorCache = {
        ...cacheRef.current,
        [tabId]: {
          data: null,
          loading: false,
          error: err,
        },
      };
      cacheRef.current = errorCache;
      setCache(errorCache);

      console.error(`Error loading ${tabId}:`, err);
    }
  }, []);

  const isLoading = useCallback((tabId: string) => {
    return cacheRef.current[tabId]?.loading ?? false;
  }, []);

  const getError = useCallback((tabId: string) => {
    return cacheRef.current[tabId]?.error ?? null;
  }, []);

  const clearCache = useCallback((tabId?: string) => {
    if (tabId) {
      const newCache = { ...cacheRef.current };
      delete newCache[tabId];
      cacheRef.current = newCache;
      setCache(newCache);
    } else {
      cacheRef.current = {};
      setCache({});
    }
  }, []);

  return {
    loadData,
    isLoading,
    getError,
    clearCache,
    cache: cacheRef.current,
  };
};
