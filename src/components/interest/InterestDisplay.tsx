/**
 * Interest Display Component
 * Shows daily yield information and interest history
 * Now using Supabase database instead of localStorage
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Clock, Sparkles, History, Zap, Gift
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemberData } from "@/hooks/useMemberData";
import { toast } from "sonner";

interface InterestRecord {
  id: string;
  createdAt: Date;
  previousBalance: number;
  interestRate: number;
  interestAmount: number;
  newBalance: number;
  referenceNumber: string;
}

interface InterestDisplayProps {
  compact?: boolean;
}

const InterestDisplay = ({ compact = false }: InterestDisplayProps) => {
  const { user } = useAuth();
  const { systemStats, refresh } = useMemberData();
  
  const [interestHistory, setInterestHistory] = useState<InterestRecord[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [todaysInterest, setTodaysInterest] = useState<InterestRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);

  // Calculate time until next interest (midnight)
  const getTimeUntilMidnight = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }, []);

  const [timeUntilNext, setTimeUntilNext] = useState(getTimeUntilMidnight());

  // Fetch interest history from database
  const fetchInterestHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('interest_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const records: InterestRecord[] = (data || []).map(record => ({
        id: record.id,
        createdAt: new Date(record.created_at),
        previousBalance: Number(record.previous_balance) / 100,
        interestRate: Number(record.interest_rate),
        interestAmount: Number(record.interest_amount) / 100,
        newBalance: Number(record.new_balance) / 100,
        referenceNumber: record.reference_number,
      }));

      setInterestHistory(records);
      setTotalEarned(records.reduce((sum, r) => sum + r.interestAmount, 0));

      // Check if today's interest exists
      const today = new Date();
      const todayRecord = records.find(r => 
        r.createdAt.getDate() === today.getDate() &&
        r.createdAt.getMonth() === today.getMonth() &&
        r.createdAt.getFullYear() === today.getFullYear()
      );
      setTodaysInterest(todayRecord || null);
    } catch (err) {
      console.error('Failed to fetch interest history:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchInterestHistory();
    }
  }, [user, fetchInterestHistory]);

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilNext(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, [getTimeUntilMidnight]);

  const formatCountdown = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatInterestAmount = (amount: number): string => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Simulate interest for demo (calls edge function)
  const handleSimulateInterest = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('apply-daily-interest', {
        body: { userId: user.id, simulate: true },
      });

      if (error) throw error;

      if (data?.success) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
        await fetchInterestHistory();
        await refresh();
        toast.success("Interest credited!");
      }
    } catch (err) {
      console.error('Failed to simulate interest:', err);
      toast.error("Failed to simulate interest");
    }
  };

  const vaultInterestRate = systemStats?.vaultInterestRate || 0.5;

  if (compact) {
    return (
      <Card className="glass-card p-3 border-success/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Daily Yield Rate</p>
              <p className="font-bold text-success">{vaultInterestRate}%</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Next in</p>
            <p className="font-mono text-sm text-foreground">{formatCountdown(timeUntilNext)}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card p-4 border-success/20 relative overflow-hidden">
        {/* Celebration Animation */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 bg-success/20 flex items-center justify-center z-10"
            >
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-success mx-auto mb-2 animate-pulse" />
                <p className="font-bold text-success text-lg">Interest Credited!</p>
                {todaysInterest && (
                  <p className="text-sm text-success/80">
                    {formatInterestAmount(todaysInterest.interestAmount)}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daily Vault Interest</h3>
              <p className="text-xs text-muted-foreground">
                Compounding at {vaultInterestRate}% daily
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <History className="w-4 h-4 mr-1" />
            History
          </Button>
        </div>

        {/* Today's Interest */}
        {loading ? (
          <Card className="p-3 bg-muted/30 border-border mb-3 animate-pulse">
            <div className="h-12 bg-muted/50 rounded" />
          </Card>
        ) : todaysInterest ? (
          <Card className="p-3 bg-success/10 border-success/30 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Today's Yield</p>
                  <p className="font-bold text-success text-lg balance-number">
                    +{formatInterestAmount(todaysInterest.interestAmount)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Rate Applied</p>
                <p className="font-bold text-success">{todaysInterest.interestRate}%</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-3 bg-muted/30 border-border mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <p className="text-xs text-muted-foreground">Next Interest In</p>
                  <p className="font-mono font-bold text-primary text-lg">
                    {formatCountdown(timeUntilNext)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Expected Yield</p>
                <p className="font-bold text-success balance-number">
                  ~{vaultInterestRate}%
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-muted/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">30-Day Total</p>
            <p className="font-bold text-success balance-number">
              {formatInterestAmount(totalEarned)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Annual Yield</p>
            <p className="font-bold text-primary">
              ~{(vaultInterestRate * 365).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Demo Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSimulateInterest}
          className="w-full mt-3 border-success/30 text-success hover:bg-success/10 text-xs"
        >
          <Zap className="w-3 h-3 mr-1" />
          Simulate Daily Interest (Demo)
        </Button>
      </Card>

      {/* Interest History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden max-h-[80vh]">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <History className="w-5 h-5 text-success" />
              Interest History
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 pt-4 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Summary */}
            <Card className="p-4 bg-success/10 border-success/30">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Earned</p>
                  <p className="text-xl font-bold text-success balance-number">
                    {formatInterestAmount(totalEarned)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payments</p>
                  <p className="text-xl font-bold text-foreground">
                    {interestHistory.length}
                  </p>
                </div>
              </div>
            </Card>

            {/* History List */}
            <div className="space-y-2">
              {interestHistory.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No interest history yet</p>
                  <p className="text-xs">Interest is calculated daily at midnight</p>
                </div>
              ) : (
                interestHistory.map((record) => (
                  <Card key={record.id} className="p-3 bg-muted/20 border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <p className="font-bold text-success balance-number">
                            +{formatInterestAmount(record.interestAmount)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(record.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Rate</p>
                        <p className="font-bold text-primary">{record.interestRate}%</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border flex justify-between text-[10px] text-muted-foreground">
                      <span>Before: ₱{record.previousBalance.toLocaleString()}</span>
                      <span>After: ₱{record.newBalance.toLocaleString()}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InterestDisplay;
