/**
 * Custom hook for fetching user data
 * Centralizes user data fetching and session logic
 */

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { User } from '@/types';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await apiGet<{ user: User }>('/api/session');
      if (userData?.user) {
        setUser(userData.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refetch = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refetch };
};

/**
 * Custom hook for checking admin status
 */
export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdmin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet<{ isAdmin: boolean }>('/api/admin/check');
      setIsAdmin(response?.isAdmin || false);
    } catch (err) {
      console.error('Failed to check admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  const refetch = useCallback(() => {
    checkAdmin();
  }, [checkAdmin]);

  return { isAdmin, loading, error, refetch };
};

/**
 * Custom hook for generic data fetching with caching
 */
export const useFetch = <T,>(url: string, shouldFetch = true) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiGet<T>(url);
      setData(result);
    } catch (err) {
      console.error(`Failed to fetch from ${url}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, shouldFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};
