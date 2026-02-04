/**
 * Hook to fetch and subscribe to public configuration settings
 * This uses the public_config table which has non-sensitive data
 * accessible to all authenticated users (vs global_settings which is admin-only)
 * 
 * Features:
 * - Retry mechanism with exponential backoff (max 3 attempts)
 * - RESTful polling (no WebSockets)
 * - Graceful error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PublicConfig {
  id: string;
  qrGatewayUrl: string | null;
  receiverName: string;
  receiverPhone: string;
  vaultInterestRate: number;
  lendingYieldRate: number;
  updatedAt: Date;
}

// Default fallback configuration
const DEFAULT_CONFIG: PublicConfig = {
  id: 'fallback',
  qrGatewayUrl: null,
  receiverName: 'Alpha Bankers Cooperative',
  receiverPhone: '+63 917 XXX XXXX',
  vaultInterestRate: 0.5,
  lendingYieldRate: 15.0,
  updatedAt: new Date(),
};

const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // 1 second
const POLLING_INTERVAL = 15000; // 15 seconds (>= 10s for stability)

export function usePublicConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  // Fetch with retry mechanism and exponential backoff
  const fetchWithRetry = useCallback(async (attempt = 1): Promise<PublicConfig | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('public_config')
        .select('*')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        return {
          id: data.id,
          qrGatewayUrl: data.qr_gateway_url,
          receiverName: data.receiver_name || 'Alpha Bankers Cooperative',
          receiverPhone: data.receiver_phone || '+63 917 XXX XXXX',
          vaultInterestRate: Number(data.vault_interest_rate) || 0.5,
          lendingYieldRate: Number(data.lending_yield_rate) || 15.0,
          updatedAt: new Date(data.updated_at),
        };
      }

      return null;
    } catch (err) {
      // Retry with exponential backoff
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(`PublicConfig fetch attempt ${attempt} failed, retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }
      
      // All retries exhausted
      console.error('PublicConfig fetch failed after all retries:', err);
      throw err;
    }
  }, []);

  // Main fetch function with deduplication
  const fetchConfig = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    
    // Throttle: minimum 10s between fetches
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 10000) return;
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      setError(null);
      
      const data = await fetchWithRetry();

      if (!isMountedRef.current) return;

      if (data) {
        setConfig(data);
      } else {
        // Use default config if no data found
        setConfig(DEFAULT_CONFIG);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Failed to fetch public config:', err);
      setError('Failed to load configuration');
      
      // Use default config on error
      if (!config) {
        setConfig(DEFAULT_CONFIG);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, [fetchWithRetry, config]);

  // Clear polling interval
  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Start polling with RESTful mechanism (no WebSockets)
  const startPolling = useCallback(() => {
    clearPolling();
    
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && user) {
        fetchConfig();
      }
    }, POLLING_INTERVAL);
  }, [clearPolling, fetchConfig, user]);

  // Initial fetch when user is available
  useEffect(() => {
    isMountedRef.current = true;

    if (user) {
      fetchConfig();
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      clearPolling();
    };
  }, [user, fetchConfig, startPolling, clearPolling]);

  // Handle visibility change - pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearPolling();
      } else if (user) {
        fetchConfig();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchConfig, startPolling, clearPolling]);

  return {
    config,
    loading,
    error,
    refresh: fetchConfig,
  };
}

export default usePublicConfig;
