/**
 * Realtime Connection Monitor Hook
 * Provides connection state, auto-reconnection, and bank-grade error messaging
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

interface ConnectionStatus {
  state: ConnectionState;
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

interface UseRealtimeConnectionOptions {
  onReconnect?: () => void;
  maxReconnectAttempts?: number;
}

export function useRealtimeConnection(options: UseRealtimeConnectionOptions = {}) {
  const { onReconnect, maxReconnectAttempts = 5 } = options;
  
  const [status, setStatus] = useState<ConnectionStatus>({
    state: 'connecting',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null,
  });

  const heartbeatChannelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    setStatus(prev => {
      if (prev.reconnectAttempts >= maxReconnectAttempts) {
        return {
          ...prev,
          state: 'error',
          error: 'Maximum reconnection attempts exceeded. Please refresh the page.',
        };
      }

      return {
        ...prev,
        state: 'reconnecting',
        reconnectAttempts: prev.reconnectAttempts + 1,
      };
    });

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, status.reconnectAttempts), 16000);
    
    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      // Force reconnect by resubscribing
      if (heartbeatChannelRef.current) {
        supabase.removeChannel(heartbeatChannelRef.current);
      }
      initializeHeartbeat();
    }, delay);
  }, [status.reconnectAttempts, maxReconnectAttempts, clearReconnectTimeout]);

  // Initialize heartbeat channel for connection monitoring
  const initializeHeartbeat = useCallback(() => {
    heartbeatChannelRef.current = supabase
      .channel('connection-heartbeat')
      .on('presence', { event: 'sync' }, () => {
        setStatus({
          state: 'connected',
          lastConnected: new Date(),
          reconnectAttempts: 0,
          error: null,
        });
        onReconnect?.();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus(prev => ({
            ...prev,
            state: 'connected',
            lastConnected: new Date(),
            reconnectAttempts: 0,
            error: null,
          }));
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setStatus(prev => ({
            ...prev,
            state: 'disconnected',
          }));
          attemptReconnect();
        } else if (status === 'CLOSED') {
          setStatus(prev => ({
            ...prev,
            state: 'disconnected',
          }));
        }
      });
  }, [onReconnect, attemptReconnect]);

  // Monitor online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        state: 'reconnecting',
      }));
      attemptReconnect();
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        state: 'disconnected',
        error: 'Network connection lost',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptReconnect]);

  // Initialize on mount
  useEffect(() => {
    initializeHeartbeat();

    return () => {
      clearReconnectTimeout();
      if (heartbeatChannelRef.current) {
        supabase.removeChannel(heartbeatChannelRef.current);
      }
    };
  }, [initializeHeartbeat, clearReconnectTimeout]);

  // Get user-friendly status message
  const getStatusMessage = useCallback((): string => {
    switch (status.state) {
      case 'connecting':
        return 'Establishing secure connection...';
      case 'connected':
        return 'Secure connection established';
      case 'reconnecting':
        return `Re-establishing secure connection... (Attempt ${status.reconnectAttempts}/${maxReconnectAttempts})`;
      case 'disconnected':
        return 'Connection interrupted. Reconnecting...';
      case 'error':
        return status.error || 'Connection error. Please refresh the page.';
      default:
        return 'Checking connection status...';
    }
  }, [status, maxReconnectAttempts]);

  return {
    ...status,
    isConnected: status.state === 'connected',
    isReconnecting: status.state === 'reconnecting' || status.state === 'connecting',
    hasError: status.state === 'error',
    statusMessage: getStatusMessage(),
    forceReconnect: attemptReconnect,
  };
}

export default useRealtimeConnection;
