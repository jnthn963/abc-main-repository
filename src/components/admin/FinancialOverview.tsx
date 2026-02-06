/**
 * ABC Master Build: Financial Overview Component
 * The 50/50 Pulse - System-wide liquidity monitoring
 * All amounts use Integer Rule: FLOOR(amount / 100)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Lock, Unlock, TrendingUp, 
  Activity, Percent, AlertTriangle, Loader2 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface FinancialStats {
  totalVaultBalance: number;
  totalFrozenBalance: number;
  totalLendingBalance: number;
  totalHoldings: number;
  liquidityRatio: number;
  dailyVaultInterest: number;
  dailyLendingProfit: number;
}

const POLLING_INTERVAL = 15000; // 15 seconds

const FinancialOverview = () => {
  const [stats, setStats] = useState<FinancialStats>({
    totalVaultBalance: 0,
    totalFrozenBalance: 0,
    totalLendingBalance: 0,
    totalHoldings: 0,
    liquidityRatio: 100,
    dailyVaultInterest: 0,
    dailyLendingProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchFinancialStats = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // Fetch all profile balances
      const { data: profiles } = await supabase
        .from('profiles')
        .select('vault_balance, frozen_balance, lending_balance');

      // Calculate totals (stored in centavos, convert to PHP)
      const totalVault = Math.floor(
        (profiles || []).reduce((sum, p) => sum + Number(p.vault_balance), 0) / 100
      );
      const totalFrozen = Math.floor(
        (profiles || []).reduce((sum, p) => sum + Number(p.frozen_balance), 0) / 100
      );
      const totalLending = Math.floor(
        (profiles || []).reduce((sum, p) => sum + Number(p.lending_balance), 0) / 100
      );
      const totalHoldings = totalVault + totalFrozen + totalLending;

      // Liquidity Ratio: (Vault / Total) * 100
      const liquidityRatio = totalHoldings > 0 
        ? Math.floor((totalVault / totalHoldings) * 100) 
        : 100;

      // Fetch 24-hour accruals from ledger
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: recentLedger } = await supabase
        .from('ledger')
        .select('type, amount')
        .gte('created_at', today.toISOString())
        .in('type', ['vault_interest', 'lending_profit']);

      const dailyVaultInterest = Math.floor(
        (recentLedger || [])
          .filter(t => t.type === 'vault_interest')
          .reduce((sum, t) => sum + Number(t.amount), 0) / 100
      );
      
      const dailyLendingProfit = Math.floor(
        (recentLedger || [])
          .filter(t => t.type === 'lending_profit')
          .reduce((sum, t) => sum + Number(t.amount), 0) / 100
      );

      setStats({
        totalVaultBalance: totalVault,
        totalFrozenBalance: totalFrozen,
        totalLendingBalance: totalLending,
        totalHoldings,
        liquidityRatio,
        dailyVaultInterest,
        dailyLendingProfit,
      });
    } catch (err) {
      console.error('Failed to fetch financial stats:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchFinancialStats();
    const interval = setInterval(fetchFinancialStats, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFinancialStats]);

  const formatPHP = (amount: number) => {
    if (amount >= 1000000) {
      return `₱${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `₱${(amount / 1000).toFixed(0)}K`;
    }
    return `₱${amount.toLocaleString()}`;
  };

  const getRatioStatus = (ratio: number) => {
    if (ratio >= 60) return { color: 'text-success', bg: 'bg-success', label: 'Healthy' };
    if (ratio >= 50.5) return { color: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Caution' };
    return { color: 'text-destructive', bg: 'bg-destructive', label: 'Critical' };
  };

  const ratioStatus = getRatioStatus(stats.liquidityRatio);

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 border-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading financial data...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-card/50 border-border">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground">Financial Overview</h2>
        <span className="text-xs text-muted-foreground ml-2">(The 50/50 Pulse)</span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Total System Liquidity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Holdings</span>
          </div>
          <p className="text-2xl font-bold text-primary balance-number">
            {formatPHP(stats.totalHoldings)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Vault + Frozen + Lending
          </p>
        </motion.div>

        {/* Liquid Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Unlock className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Liquid (Vault)</span>
          </div>
          <p className="text-2xl font-bold text-success balance-number">
            {formatPHP(stats.totalVaultBalance)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Available for operations
          </p>
        </motion.div>

        {/* Locked Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Locked/Lent</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400 balance-number">
            {formatPHP(stats.totalFrozenBalance + stats.totalLendingBalance)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Frozen: {formatPHP(stats.totalFrozenBalance)} • Lending: {formatPHP(stats.totalLendingBalance)}
          </p>
        </motion.div>

        {/* 24H Accruals */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">24H Accruals</span>
          </div>
          <p className="text-2xl font-bold text-purple-400 balance-number">
            {formatPHP(stats.dailyVaultInterest + stats.dailyLendingProfit)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Vault: +{formatPHP(stats.dailyVaultInterest)} • Lending: +{formatPHP(stats.dailyLendingProfit)}
          </p>
        </motion.div>
      </div>

      {/* Liquidity Ratio Gauge */}
      <div className="p-4 rounded-lg bg-muted/20 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Liquidity Ratio</span>
          </div>
          <div className="flex items-center gap-2">
            {stats.liquidityRatio < 50.5 && (
              <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
            )}
            <span className={`text-lg font-bold balance-number ${ratioStatus.color}`}>
              {stats.liquidityRatio}%
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${ratioStatus.bg}/20 ${ratioStatus.color}`}>
              {ratioStatus.label}
            </span>
          </div>
        </div>

        <Progress 
          value={stats.liquidityRatio} 
          className="h-3"
        />

        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>0% (Illiquid)</span>
          <span className="text-yellow-400">50.5% (Safety Buffer)</span>
          <span>100% (Fully Liquid)</span>
        </div>

        {stats.liquidityRatio < 50.5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs"
          >
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Liquidity below safety threshold. Consider enabling Read-Only mode to protect withdrawals.
          </motion.div>
        )}
      </div>
    </Card>
  );
};

export default FinancialOverview;
