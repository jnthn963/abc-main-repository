/**
 * ABC Master Build: Member Data (Internal)
 *
 * NOTE: This file contains the actual data-fetching + polling logic.
 * It is intended to be used via MemberDataProvider (see useMemberData.tsx)
 * so we only run one poller in the app.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePollingRefresh } from '@/hooks/usePollingRefresh';
import { runDeduped } from '@/lib/requestController';

export interface MemberData {
  id: string;
  memberId: string;
  displayName: string;
  vaultBalance: number;
  frozenBalance: number;
  lendingBalance: number;
  membershipTier: 'bronze' | 'silver' | 'gold';
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
}

export interface SystemStats {
  totalVaultDeposits: number;
  totalActiveLoans: number;
  activeLoansCount: number;
  reserveFund: number;
  vaultInterestRate: number;
  lendingYieldRate: number;
  borrowerCostRate: number;
}

export interface PendingTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: Date;
  clearingEndsAt: Date | null;
  referenceNumber: string;
  destination: string | null;
  description: string | null;
}

// Constants
const AGING_PERIOD_MS = 6 * 24 * 60 * 60 * 1000; // 6 days (144 hours)
const COLLATERAL_RATIO = 0.5; // 50% max loan
const POLLING_INTERVAL = 15000; // Emergency stability: >= 10s

export function useMemberDataInternal() {
  const { user, profile, refreshProfile } = useAuth();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  // Transform profile to MemberData (balances are set once on login, then updated via optimistic UI)
  useEffect(() => {
    if (profile) {
      setMemberData({
        id: profile.id,
        memberId: profile.member_id,
        displayName: profile.display_name || 'Alpha Member',
        vaultBalance: Math.floor(Number(profile.vault_balance) / 100), // Whole Peso Mandate
        frozenBalance: Math.floor(Number(profile.frozen_balance) / 100),
        lendingBalance: Math.floor(Number(profile.lending_balance) / 100),
        membershipTier: profile.membership_tier as 'bronze' | 'silver' | 'gold',
        kycStatus: profile.kyc_status as 'pending' | 'verified' | 'rejected',
        createdAt: new Date((profile as { created_at: string }).created_at),
      });
    }
  }, [profile]);

  // Fetch system stats from public_config and reserve_fund
  const fetchSystemStats = useCallback(async () => {
    try {
      const data = await runDeduped(
        'memberData:systemStats',
        async () => {
          const [publicConfigResult, reserveResult, loansResult] = await Promise.all([
            supabase.from('public_config').select('*').maybeSingle(),
            supabase.from('reserve_fund').select('*').maybeSingle(),
            supabase.from('p2p_loans').select('principal_amount').in('status', ['open', 'funded']),
          ]);

          const publicConfig = publicConfigResult.data;
          const reserve = reserveResult.data;
          const loans = loansResult.data || [];

          // Whole Peso Mandate: Math.floor() on all currency values
          const totalLoans = Math.floor(
            loans.reduce((sum, loan) => sum + Number(loan.principal_amount) / 100, 0)
          );

          return {
            totalVaultDeposits: 12450000,
            totalActiveLoans: totalLoans,
            activeLoansCount: loans.length,
            reserveFund: reserve ? Math.floor(Number(reserve.total_reserve_balance) / 100) : 0,
            vaultInterestRate: publicConfig?.vault_interest_rate || 0.5,
            lendingYieldRate: publicConfig?.lending_yield_rate || 15.0,
            borrowerCostRate: 15.0,
          } satisfies SystemStats;
        },
        { minIntervalMs: 10000 }
      );

      setSystemStats(data);
    } catch (err) {
      console.error('Failed to fetch system stats:', err);
      setError('Failed to load system statistics');
    }
  }, []);

  // Fetch pending transactions from ledger
  const fetchPendingTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const data = await runDeduped(
        `memberData:pendingTx:${user.id}`,
        async () => {
          const { data, error: fetchError } = await supabase
            .from('ledger')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'clearing')
            .order('created_at', { ascending: false });

          if (fetchError) throw fetchError;

          return (data || []).map((tx) => ({
            id: tx.id,
            type: tx.type,
            amount: Math.floor(Number(tx.amount) / 100),
            status: tx.status,
            createdAt: new Date(tx.created_at),
            clearingEndsAt: tx.clearing_ends_at ? new Date(tx.clearing_ends_at) : null,
            referenceNumber: tx.reference_number,
            destination: tx.destination,
            description: tx.description,
          })) satisfies PendingTransaction[];
        },
        { minIntervalMs: 10000 }
      );

      setPendingTransactions(data);
    } catch (err) {
      console.error('Failed to fetch pending transactions:', err);
    }
  }, [user]);

  // Full refresh (includes profile/balances)
  const refreshAll = useCallback(async () => {
    if (isFetchingRef.current || !user) return;
    isFetchingRef.current = true;

    try {
      await Promise.all([
        refreshProfile(),
        fetchSystemStats(),
        fetchPendingTransactions(),
      ]);
    } finally {
      isFetchingRef.current = false;
    }
  }, [user, refreshProfile, fetchSystemStats, fetchPendingTransactions]);

  // Poll refresh (NO profile refresh) — prevents balance thrash and request floods
  const pollRefresh = useCallback(async () => {
    if (isFetchingRef.current || !user) return;
    isFetchingRef.current = true;

    try {
      await Promise.all([
        fetchSystemStats(),
        fetchPendingTransactions(),
      ]);
    } finally {
      isFetchingRef.current = false;
    }
  }, [user, fetchSystemStats, fetchPendingTransactions]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    };

    if (user) {
      init();
    }
  }, [user, refreshAll]);

  // Polling-based refresh (stability mode)
  usePollingRefresh(pollRefresh, {
    interval: POLLING_INTERVAL,
    enabled: !!user,
    immediate: false, // Already fetched on mount
  });

  // Check if funds are aged (6-day rule)
  const areFundsAged = useCallback((): boolean => {
    if (!profile) return false;
    const createdAt = new Date((profile as { created_at: string }).created_at);
    const ageMs = Date.now() - createdAt.getTime();
    return ageMs >= AGING_PERIOD_MS;
  }, [profile]);

  // Get time remaining until funds are aged
  const getAgingTimeRemaining = useCallback((): number => {
    if (!profile) return AGING_PERIOD_MS;
    const createdAt = new Date((profile as { created_at: string }).created_at);
    const ageMs = Date.now() - createdAt.getTime();
    return Math.max(0, AGING_PERIOD_MS - ageMs);
  }, [profile]);

  // Calculate max loan amount (50% collateral rule)
  const calculateMaxLoan = useCallback((): number => {
    if (!memberData) return 0;
    return Math.floor(memberData.vaultBalance * COLLATERAL_RATIO);
  }, [memberData]);

  // Calculate market sentiment (loan-to-deposit ratio)
  const calculateMarketSentiment = useCallback((): number => {
    if (!systemStats || systemStats.totalVaultDeposits === 0) return 50;
    const ratio = systemStats.totalActiveLoans / systemStats.totalVaultDeposits;
    const sentiment = Math.min(100, Math.max(0, (ratio / 0.4) * 100));
    return Math.round(sentiment);
  }, [systemStats]);

  // Optimistic balance update for instant UI feedback
  const optimisticUpdateBalance = useCallback(
    (balanceType: 'vault' | 'frozen' | 'lending', delta: number) => {
      setMemberData((prev) => {
        if (!prev) return prev;

        const key =
          balanceType === 'vault'
            ? 'vaultBalance'
            : balanceType === 'frozen'
              ? 'frozenBalance'
              : 'lendingBalance';

        return {
          ...prev,
          [key]: Math.floor(Math.max(0, (prev as any)[key] + delta)),
        } as MemberData;
      });
    },
    []
  );

  return {
    memberData,
    systemStats,
    pendingTransactions,
    loading,
    error,
    areFundsAged,
    getAgingTimeRemaining,
    calculateMaxLoan,
    calculateMarketSentiment,
    refresh: refreshAll,
    optimisticUpdateBalance,
  };
}

export default useMemberDataInternal;
