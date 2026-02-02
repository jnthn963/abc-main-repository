/**
 * ABC Master Build: Governor Dashboard Polling Hook
 * Replaces websockets with 10-second polling for stability
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePollingRefresh } from '@/hooks/usePollingRefresh';

export interface GovernorStats {
  totalMembers: number;
  activeLoans: number;
  totalVaultValue: number;
  reserveFund: number;
  pendingWithdrawals: number;
  dailyTransactions: number;
}

export interface GovernorSettings {
  vaultRate: number;
  lendingRate: number;
  borrowerCost: number;
  killSwitch: boolean;
  maintenanceMode: boolean;
  qrUrl: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
}

export interface AuditEvent {
  id: string;
  time: string;
  event: string;
  type: string;
  adminId?: string;
}

const POLLING_INTERVAL = 10000; // 10 seconds for governor dashboard

export function useGovernorRealtime() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<GovernorStats>({
    totalMembers: 0,
    activeLoans: 0,
    totalVaultValue: 0,
    reserveFund: 0,
    pendingWithdrawals: 0,
    dailyTransactions: 0,
  });
  const [settings, setSettings] = useState<GovernorSettings>({
    vaultRate: 0.5,
    lendingRate: 15.0,
    borrowerCost: 18.0,
    killSwitch: false,
    maintenanceMode: false,
    qrUrl: null,
    receiverName: null,
    receiverPhone: null,
  });
  const [auditFeed, setAuditFeed] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const isAuthorized = hasRole('governor') || hasRole('admin');

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthorized || isFetchingRef.current) return;

    isFetchingRef.current = true;
    
    try {
      setError(null);

      // Parallel fetch all data
      const [
        settingsResult,
        reserveResult,
        memberCountResult,
        activeLoansResult,
        pendingTxnsResult,
        dailyCountResult,
        profilesResult,
        auditResult,
      ] = await Promise.all([
        supabase.from('global_settings').select('*').maybeSingle(),
        supabase.from('reserve_fund').select('total_reserve_balance').maybeSingle(),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('p2p_loans').select('principal_amount').in('status', ['open', 'funded']),
        supabase.from('ledger').select('amount').eq('status', 'clearing').eq('type', 'withdrawal'),
        supabase.from('ledger').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('profiles').select('vault_balance'),
        supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(15),
      ]);

      // Update settings
      if (settingsResult.data) {
        setSettings({
          vaultRate: settingsResult.data.vault_interest_rate || 0.5,
          lendingRate: settingsResult.data.lending_yield_rate || 15.0,
          borrowerCost: settingsResult.data.borrower_cost_rate || 18.0,
          killSwitch: settingsResult.data.system_kill_switch || false,
          maintenanceMode: settingsResult.data.maintenance_mode || false,
          qrUrl: settingsResult.data.qr_gateway_url,
          receiverName: settingsResult.data.receiver_name,
          receiverPhone: settingsResult.data.receiver_phone,
        });
      }

      // Calculate stats with Whole Peso Mandate
      const totalVault = Math.floor((profilesResult.data || []).reduce(
        (sum, p) => sum + Number(p.vault_balance), 0
      ) / 100);
      const pendingWdAmount = Math.floor((pendingTxnsResult.data || []).reduce(
        (sum, t) => sum + Number(t.amount), 0
      ) / 100);

      setStats({
        totalMembers: memberCountResult.count || 0,
        activeLoans: activeLoansResult.data?.length || 0,
        totalVaultValue: totalVault,
        reserveFund: reserveResult.data ? Math.floor(Number(reserveResult.data.total_reserve_balance) / 100) : 0,
        pendingWithdrawals: pendingWdAmount,
        dailyTransactions: dailyCountResult.count || 0,
      });

      // Transform audit events
      if (auditResult.data && auditResult.data.length > 0) {
        setAuditFeed(auditResult.data.map(a => ({
          id: a.id,
          time: new Date(a.created_at).toLocaleTimeString('en-PH', { hour12: false }),
          event: a.action,
          type: 'system',
          adminId: a.admin_id,
        })));
      } else {
        // Fallback to recent ledger activity
        const { data: recentActivity } = await supabase
          .from('ledger')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15);

        setAuditFeed((recentActivity || []).map(tx => ({
          id: tx.id,
          time: new Date(tx.created_at).toLocaleTimeString('en-PH', { hour12: false }),
          event: `${tx.type.replace(/_/g, ' ').toUpperCase()} - ₱${Math.floor(Number(tx.amount) / 100).toLocaleString()}`,
          type: tx.type.includes('deposit') ? 'deposit' : tx.type.includes('withdrawal') ? 'withdraw' : 'system',
        })));
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch governor data:', err);
      setError('Failed to load dashboard data');
    } finally {
      isFetchingRef.current = false;
    }
  }, [isAuthorized]);

  // Polling-based refresh (replaces websocket realtime)
  usePollingRefresh(fetchDashboardData, {
    interval: POLLING_INTERVAL,
    enabled: isAuthorized && !!user,
    immediate: true,
  });

  // Update settings in database with optimistic update
  const updateSettings = useCallback(async (updates: Partial<GovernorSettings>) => {
    // Optimistic update
    setSettings(prev => ({ ...prev, ...updates }));
    
    try {
      const { data: settingsData } = await supabase
        .from('global_settings')
        .select('id')
        .maybeSingle();

      if (!settingsData?.id) {
        throw new Error('Settings not found');
      }

      const dbUpdates: Record<string, unknown> = {};
      if (updates.vaultRate !== undefined) dbUpdates.vault_interest_rate = updates.vaultRate;
      if (updates.lendingRate !== undefined) dbUpdates.lending_yield_rate = updates.lendingRate;
      if (updates.borrowerCost !== undefined) dbUpdates.borrower_cost_rate = updates.borrowerCost;
      if (updates.killSwitch !== undefined) dbUpdates.system_kill_switch = updates.killSwitch;
      if (updates.maintenanceMode !== undefined) dbUpdates.maintenance_mode = updates.maintenanceMode;
      if (updates.qrUrl !== undefined) dbUpdates.qr_gateway_url = updates.qrUrl;
      if (updates.receiverName !== undefined) dbUpdates.receiver_name = updates.receiverName;
      if (updates.receiverPhone !== undefined) dbUpdates.receiver_phone = updates.receiverPhone;

      const { error } = await supabase
        .from('global_settings')
        .update(dbUpdates)
        .eq('id', settingsData.id);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Failed to update settings:', err);
      // Revert on error
      fetchDashboardData();
      return { success: false, error: err };
    }
  }, [fetchDashboardData]);

  return {
    stats,
    settings,
    auditFeed,
    loading,
    error,
    refresh: fetchDashboardData,
    updateSettings,
    isAuthorized,
  };
}

export default useGovernorRealtime;
