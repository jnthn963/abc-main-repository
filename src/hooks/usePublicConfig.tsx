/**
 * Hook to fetch and subscribe to public configuration settings
 * This uses the public_config table which has non-sensitive data
 * accessible to all authenticated users (vs global_settings which is admin-only)
 */

import { useState, useEffect, useCallback } from 'react';
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

export function usePublicConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch public config
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('public_config')
        .select('*')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setConfig({
          id: data.id,
          qrGatewayUrl: data.qr_gateway_url,
          receiverName: data.receiver_name || 'Alpha Banking Cooperative',
          receiverPhone: data.receiver_phone || '+63 917 XXX XXXX',
          vaultInterestRate: Number(data.vault_interest_rate) || 0.5,
          lendingYieldRate: Number(data.lending_yield_rate) || 15.0,
          updatedAt: new Date(data.updated_at),
        });
      }
    } catch (err) {
      console.error('Failed to fetch public config:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchConfig();
    }
  }, [user, fetchConfig]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_config',
        },
        (payload) => {
          console.log('Public config changed:', payload);
          // Refetch to get the updated config
          fetchConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConfig]);

  return {
    config,
    loading,
    error,
    refresh: fetchConfig,
  };
}

export default usePublicConfig;
