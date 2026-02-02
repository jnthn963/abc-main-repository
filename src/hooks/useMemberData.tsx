/**
 * ABC Master Build: Member Data (Public API)
 *
 * Emergency stability: we expose member data via a Provider so the app
 * only runs ONE poller regardless of how many components call useMemberData().
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useMemberDataInternal } from '@/hooks/useMemberDataInternal';
export type { MemberData, SystemStats, PendingTransaction } from '@/hooks/useMemberDataInternal';

type MemberDataContextValue = ReturnType<typeof useMemberDataInternal>;

const MemberDataContext = createContext<MemberDataContextValue | null>(null);

export function MemberDataProvider({ children }: { children: ReactNode }) {
  const value = useMemberDataInternal();
  return <MemberDataContext.Provider value={value}>{children}</MemberDataContext.Provider>;
}

export function useMemberData() {
  const ctx = useContext(MemberDataContext);
  if (!ctx) {
    throw new Error('useMemberData must be used within a MemberDataProvider');
  }
  return ctx;
}

export default useMemberData;

