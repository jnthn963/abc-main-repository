/**
 * ABC Audit Trail / Ledger Verification Component
 * 
 * Displays real-time ledger entries for complete transparency.
 * Shows: VAULT_INTEREST, LENDING_PROFIT, PATRONAGE_REWARD, etc.
 * "Trust through Transparency" - every peso movement is verified.
 * 
 * MOBILE: Uses card-based layout with tap-to-expand
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import MobileAuditCard from './MobileAuditCard';
import { 
  FileText, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Coins, 
  Users, 
  Shield,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  reference_number: string;
  description: string | null;
}

const TRANSACTION_CONFIG: Record<string, { 
  icon: typeof TrendingUp; 
  color: string; 
  label: string;
  bgColor: string;
}> = {
  vault_interest: { 
    icon: TrendingUp, 
    color: 'text-[#00FF41]', 
    label: 'Vault Yield (0.5%)',
    bgColor: 'bg-[#00FF41]/10'
  },
  lending_profit: { 
    icon: Coins, 
    color: 'text-[#FFD700]', 
    label: 'Lending Synergy (+0.5%)',
    bgColor: 'bg-[#FFD700]/10'
  },
  deposit: { 
    icon: ArrowDownLeft, 
    color: 'text-emerald-400', 
    label: 'Capital Injection',
    bgColor: 'bg-emerald-400/10'
  },
  withdrawal: { 
    icon: ArrowUpRight, 
    color: 'text-red-400', 
    label: 'Sovereign Settlement',
    bgColor: 'bg-red-400/10'
  },
  transfer_in: { 
    icon: ArrowDownLeft, 
    color: 'text-blue-400', 
    label: 'Transfer Received',
    bgColor: 'bg-blue-400/10'
  },
  transfer_out: { 
    icon: ArrowUpRight, 
    color: 'text-orange-400', 
    label: 'Transfer Sent',
    bgColor: 'bg-orange-400/10'
  },
  referral_commission: { 
    icon: Users, 
    color: 'text-[#D4AF37]', 
    label: 'Patronage Reward (5%)',
    bgColor: 'bg-[#D4AF37]/10'
  },
  loan_funding: { 
    icon: Shield, 
    color: 'text-purple-400', 
    label: 'Loan Funded',
    bgColor: 'bg-purple-400/10'
  },
  loan_repayment: { 
    icon: CheckCircle2, 
    color: 'text-teal-400', 
    label: 'Loan Repayment',
    bgColor: 'bg-teal-400/10'
  },
  collateral_lock: { 
    icon: Shield, 
    color: 'text-amber-400', 
    label: 'Collateral Locked (50%)',
    bgColor: 'bg-amber-400/10'
  },
  collateral_release: { 
    icon: Shield, 
    color: 'text-green-400', 
    label: 'Collateral Released',
    bgColor: 'bg-green-400/10'
  },
};

export default function AuditTrail() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLedger = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ledger')
        .select('id, type, amount, status, created_at, reference_number, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLedger();
  };

  const getConfig = (type: string) => {
    return TRANSACTION_CONFIG[type] || { 
      icon: FileText, 
      color: 'text-gray-400', 
      label: type.replace(/_/g, ' ').toUpperCase(),
      bgColor: 'bg-gray-400/10'
    };
  };

  const formatAmount = (amount: number, type: string) => {
    const pesos = Math.floor(amount / 100);
    const isCredit = ['deposit', 'vault_interest', 'lending_profit', 'transfer_in', 'referral_commission', 'loan_repayment', 'collateral_release'].includes(type);
    const prefix = isCredit ? '+' : '-';
    return `${prefix}₱${Math.abs(pesos).toLocaleString('en-PH')}`;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border-[#D4AF37]/20">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mobile View - Card-based with tap-to-expand
  if (isMobile) {
    return (
      <Card className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border-[#D4AF37]/20 shadow-xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
            <CardTitle className="text-base font-bold text-white">
              Ledger
            </CardTitle>
            <Badge variant="outline" className="text-[8px] border-[#00FF41]/30 text-[#00FF41]">
              {entries.length}
            </Badge>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-[#D4AF37] ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </CardHeader>

        <CardContent className="pt-0">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <FileText className="w-10 h-10 text-gray-600 mb-2" />
              <p className="text-sm text-gray-500">No transactions yet</p>
              <p className="text-xs text-gray-600">Your financial movements will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 10).map((entry) => (
                <MobileAuditCard key={entry.id} entry={entry} />
              ))}
              
              {entries.length > 10 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  +{entries.length - 10} more entries
                </p>
              )}
            </div>
          )}

          {/* Footer - Trust Badge */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-3 h-3 text-[#D4AF37]/60" />
              <span className="text-[9px] text-gray-500">
                Verified by ABC Protocol
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop View - Original layout
  return (
    <Card className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border-[#D4AF37]/20 shadow-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#D4AF37]" />
          <CardTitle className="text-base font-bold text-white">
            Ledger Verification
          </CardTitle>
          <Badge variant="outline" className="text-[9px] border-[#00FF41]/30 text-[#00FF41]">
            AUDIT TRAIL
          </Badge>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <FileText className="w-10 h-10 text-gray-600 mb-2" />
              <p className="text-sm text-gray-500">No transactions yet</p>
              <p className="text-xs text-gray-600">Your financial movements will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const config = getConfig(entry.type);
                const Icon = config.icon;
                
                return (
                  <div
                    key={entry.id}
                    className={`group p-3 rounded-lg ${config.bgColor} border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-black/40 ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${config.color}`}>
                            {config.label}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {format(new Date(entry.created_at), 'MMM d, yyyy • HH:mm')}
                          </p>
                          {entry.description && (
                            <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[180px]">
                              {entry.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono text-sm font-bold ${
                          formatAmount(entry.amount, entry.type).startsWith('+') 
                            ? 'text-[#00FF41]' 
                            : 'text-red-400'
                        }`}>
                          {formatAmount(entry.amount, entry.type)}
                        </p>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          {entry.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3 text-[#00FF41]" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          )}
                          <span className="text-[9px] text-gray-500 font-mono">
                            {entry.reference_number.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer - Trust Badge */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-[#D4AF37]/60" />
              <span className="text-[9px] text-gray-500">
                All transactions verified by ABC Protocol
              </span>
            </div>
            <span className="text-[9px] text-[#00FF41]/60 font-mono">
              {entries.length} entries
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
