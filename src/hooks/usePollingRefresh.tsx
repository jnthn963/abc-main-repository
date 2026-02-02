/**
 * ABC Master Build: Polling-Based Data Refresh Hook
 * Replaces websocket connections with lightweight RESTful polling
 * Zero-latency, zero-connection-drops architecture
 */

import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  interval?: number;  // Polling interval in ms (default: 8000)
  enabled?: boolean;  // Whether polling is active
  immediate?: boolean; // Whether to call immediately on mount
}

export function usePollingRefresh(
  callback: () => void | Promise<void>,
  options: UsePollingOptions = {}
) {
  const { interval = 8000, enabled = true, immediate = true } = options;
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clear existing interval
  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    clearPolling();
    
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);
  }, [interval, enabled, clearPolling]);

  // Manual refresh trigger
  const refresh = useCallback(() => {
    callbackRef.current();
  }, []);

  // Initialize polling
  useEffect(() => {
    if (immediate && enabled) {
      callbackRef.current();
    }
    
    startPolling();

    return () => {
      clearPolling();
    };
  }, [immediate, enabled, startPolling, clearPolling]);

  // Handle visibility change - pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearPolling();
      } else {
        if (enabled) {
          callbackRef.current(); // Refresh immediately when tab becomes visible
          startPolling();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, clearPolling]);

  return {
    refresh,
    isPolling: enabled && intervalRef.current !== null,
  };
}

export default usePollingRefresh;
