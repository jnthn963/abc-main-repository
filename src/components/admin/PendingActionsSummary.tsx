import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  HandCoins,
  Clock,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePollingRefresh } from "@/hooks/usePollingRefresh";

interface PendingCounts {
  deposits: number;
  withdrawals: number;
  transfers: number;
  loans: number;
  total: number;
}

const PendingActionsSummary = () => {
  const [counts, setCounts] = useState<PendingCounts>({
    deposits: 0,
    withdrawals: 0,
    transfers: 0,
    loans: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_pending_action_counts');

      if (error) throw error;

      if (data && typeof data === 'object') {
        const parsedData = data as Record<string, unknown>;
        setCounts({
          deposits: Number(parsedData.deposits) || 0,
          withdrawals: Number(parsedData.withdrawals) || 0,
          transfers: Number(parsedData.transfers) || 0,
          loans: Number(parsedData.loans) || 0,
          total: Number(parsedData.total) || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch pending counts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 10s instead of realtime subscriptions
  usePollingRefresh(fetchCounts, {
    interval: 10000,
    enabled: true,
    immediate: true,
  });

  const items = [
    {
      label: "Deposits",
      count: counts.deposits,
      icon: ArrowDownRight,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
    },
    {
      label: "Withdrawals",
      count: counts.withdrawals,
      icon: ArrowUpRight,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
    },
    {
      label: "Transfers",
      count: counts.transfers,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    {
      label: "Loans",
      count: counts.loans,
      icon: HandCoins,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
    },
  ];

  return (
    <Card className="p-4 bg-card/50 border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-foreground">Pending Actions</h3>
          {counts.total > 0 && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-1 text-sm font-bold bg-amber-500 text-amber-950 rounded-full"
            >
              {counts.total}
            </motion.span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchCounts}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="py-4 text-center">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-3 rounded-lg ${item.bgColor} border ${item.borderColor} text-center relative`}
            >
              <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-1`} />
              <p className={`text-2xl font-bold ${item.color} balance-number`}>
                {item.count}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              
              {item.count > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3"
                >
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {counts.total === 0 && !loading && (
        <p className="text-sm text-center text-muted-foreground mt-2">
          All actions have been processed ✓
        </p>
      )}
    </Card>
  );
};

export default PendingActionsSummary;
