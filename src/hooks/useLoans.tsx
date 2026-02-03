/**
 * Supabase-backed Loans Hook
 * Replaces localStorage loanStore with real database queries
 * 
 * STABILITY FIX: Loading state only shows on initial fetch,
 * polling uses silent refresh to prevent UI flicker.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { usePollingRefresh } from '@/hooks/usePollingRefresh';
import { runDeduped } from '@/lib/requestController';

export interface P2PLoan {
  id: string;
  borrowerId: string;
  borrowerAlias: string;
  lenderId: string | null;
  lenderAlias: string | null;
  principalAmount: number;
  interestRate: number;
  interestAmount: number;
  duration: number;
  status: 'open' | 'funded' | 'repaid' | 'defaulted';
  collateralAmount: number;
  createdAt: Date;
  fundedAt: Date | null;
  dueAt: Date | null;
  repaidAt: Date | null;
  autoRepayTriggered: boolean;
  referenceNumber: string;
}

// Generate masked alias from member ID
export const generateAlias = (memberId: string): string => {
  const parts = memberId.split('-');
  if (parts.length >= 3) {
    const last4 = parts[2].slice(-1);
    return `${parts[0][0]}***${last4}`;
  }
  return memberId.slice(0, 1) + '***' + memberId.slice(-1);
};

// Transform database loan to P2PLoan interface
const transformLoan = async (
  loan: Tables<'p2p_loans'>,
  profilesMap: Map<string, { member_id: string }>
): Promise<P2PLoan> => {
  const borrowerProfile = profilesMap.get(loan.borrower_id);
  const lenderProfile = loan.lender_id ? profilesMap.get(loan.lender_id) : null;

  const borrowerMemberId = borrowerProfile?.member_id || 'Unknown';
  const lenderMemberId = lenderProfile?.member_id;

  return {
    id: loan.id,
    borrowerId: loan.borrower_id,
    borrowerAlias: generateAlias(borrowerMemberId),
    lenderId: loan.lender_id,
    lenderAlias: lenderMemberId ? generateAlias(lenderMemberId) : null,
    principalAmount: Number(loan.principal_amount) / 100,
    interestRate: Number(loan.interest_rate),
    interestAmount: (Number(loan.principal_amount) / 100) * (Number(loan.interest_rate) / 100),
    duration: loan.duration_days,
    status: loan.status as P2PLoan['status'],
    collateralAmount: Number(loan.collateral_amount) / 100,
    createdAt: new Date(loan.created_at),
    fundedAt: loan.funded_at ? new Date(loan.funded_at) : null,
    dueAt: loan.due_date ? new Date(loan.due_date) : null,
    repaidAt: loan.repaid_at ? new Date(loan.repaid_at) : null,
    autoRepayTriggered: loan.auto_repay_triggered,
    referenceNumber: loan.reference_number,
  };
};

export function useLoans() {
  const { user } = useAuth();
  const [openLoans, setOpenLoans] = useState<P2PLoan[]>([]);
  const [myLoansAsBorrower, setMyLoansAsBorrower] = useState<P2PLoan[]>([]);
  const [myLoansAsLender, setMyLoansAsLender] = useState<P2PLoan[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // STABILITY FIX: Track initial load vs polling
  const hasInitialDataRef = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const POLLING_INTERVAL = 15000; // Emergency stability: >= 10s

  // Fetch all loans with member aliases
  const fetchLoans = useCallback(async () => {
    if (!user) return;

    try {
      const result = await runDeduped(
        `loans:all:${user.id}`,
        async () => {
          // Fetch open loans (available for funding)
          const { data: openLoansData, error: openError } = await supabase
            .from('p2p_loans')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: false });

          if (openError) throw openError;

          // Fetch my loans as borrower
          const { data: borrowerLoansData, error: borrowerError } = await supabase
            .from('p2p_loans')
            .select('*')
            .eq('borrower_id', user.id)
            .order('created_at', { ascending: false });

          if (borrowerError) throw borrowerError;

          // Fetch my loans as lender
          const { data: lenderLoansData, error: lenderError } = await supabase
            .from('p2p_loans')
            .select('*')
            .eq('lender_id', user.id)
            .order('created_at', { ascending: false });

          if (lenderError) throw lenderError;

          // Collect all unique user IDs
          const allLoans = [
            ...(openLoansData || []),
            ...(borrowerLoansData || []),
            ...(lenderLoansData || []),
          ];
          const userIds = new Set<string>();
          allLoans.forEach((loan) => {
            userIds.add(loan.borrower_id);
            if (loan.lender_id) userIds.add(loan.lender_id);
          });

          // Fetch all relevant profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, member_id')
            .in('id', Array.from(userIds));

          const profilesMap = new Map<string, { member_id: string }>();
          (profiles || []).forEach((p) => profilesMap.set(p.id, { member_id: p.member_id }));

          // Transform loans
          const transformedOpenLoans = await Promise.all(
            (openLoansData || []).map((loan) => transformLoan(loan, profilesMap))
          );
          const transformedBorrowerLoans = await Promise.all(
            (borrowerLoansData || []).map((loan) => transformLoan(loan, profilesMap))
          );
          const transformedLenderLoans = await Promise.all(
            (lenderLoansData || []).map((loan) => transformLoan(loan, profilesMap))
          );

          return {
            open: transformedOpenLoans,
            borrower: transformedBorrowerLoans,
            lender: transformedLenderLoans,
          };
        },
        { minIntervalMs: 10000 }
      );

      setOpenLoans(result.open);
      setMyLoansAsBorrower(result.borrower);
      setMyLoansAsLender(result.lender);
      setError(null);
      
      // STABILITY FIX: Mark initial data loaded
      if (!hasInitialDataRef.current) {
        hasInitialDataRef.current = true;
        setIsInitialLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch loans:', err);
      setError('Failed to load loans');
      // Still mark initial load complete on error to prevent infinite loading
      if (!hasInitialDataRef.current) {
        hasInitialDataRef.current = true;
        setIsInitialLoading(false);
      }
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchLoans();
    }
  }, [user, fetchLoans]);

  // Emergency stability: polling (no websockets) - SILENT, no loading changes
  usePollingRefresh(
    fetchLoans,
    {
      interval: POLLING_INTERVAL,
      enabled: !!user,
      immediate: false,
    }
  );

  // Get marketplace statistics
  const getMarketplaceStats = useCallback(() => {
    const fundedLoans = myLoansAsLender.filter(l => l.status === 'funded');
    const completedLoans = [...myLoansAsBorrower, ...myLoansAsLender].filter(
      l => l.status === 'repaid' || l.status === 'defaulted'
    );

    const totalOpenValue = openLoans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalFundedValue = fundedLoans.reduce((sum, l) => sum + l.principalAmount, 0);
    const averageInterestRate = openLoans.length > 0
      ? openLoans.reduce((sum, l) => sum + l.interestRate, 0) / openLoans.length
      : 0;

    return {
      openLoansCount: openLoans.length,
      fundedLoansCount: fundedLoans.length,
      completedLoansCount: completedLoans.length,
      totalOpenValue,
      totalFundedValue,
      averageInterestRate,
    };
  }, [openLoans, myLoansAsBorrower, myLoansAsLender]);

  // STABILITY FIX: Memoize return value
  return useMemo(() => ({
    openLoans,
    myLoansAsBorrower,
    myLoansAsLender,
    loading: isInitialLoading, // Only true during initial load
    error,
    refresh: fetchLoans,
    getMarketplaceStats,
  }), [openLoans, myLoansAsBorrower, myLoansAsLender, isInitialLoading, error, fetchLoans, getMarketplaceStats]);
}

export default useLoans;
