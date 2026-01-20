/**
 * Interest Display Component
 * Shows daily yield information and interest history
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Clock, Calendar, Sparkles, History,
  ChevronRight, Zap, Gift
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getInterestHistory,
  getTotalInterestEarned,
  getTimeUntilNextInterest,
  getTodaysInterest,
  subscribeInterestStore,
  simulateInterestPayment,
  formatInterestAmount,
  type InterestRecord,
} from "@/stores/interestEngine";
import { getSystemStats, subscribeMemberStore } from "@/stores/memberStore";

interface InterestDisplayProps {
  compact?: boolean;
}

const InterestDisplay = ({ compact = false }: InterestDisplayProps) => {
  const [todaysInterest, setTodaysInterest] = useState<InterestRecord | null>(getTodaysInterest());
  const [totalEarned, setTotalEarned] = useState(getTotalInterestEarned());
  const [timeUntilNext, setTimeUntilNext] = useState(getTimeUntilNextInterest());
  const [showHistory, setShowHistory] = useState(false);
  const [interestHistory, setInterestHistory] = useState<InterestRecord[]>(getInterestHistory());
  const [showCelebration, setShowCelebration] = useState(false);
  const stats = getSystemStats();

  // Subscribe to interest and member store changes
  useEffect(() => {
    const updateData = () => {
      setTodaysInterest(getTodaysInterest());
      setTotalEarned(getTotalInterestEarned());
      setInterestHistory(getInterestHistory());
    };

    const unsubscribeInterest = subscribeInterestStore(updateData);
    const unsubscribeMember = subscribeMemberStore(updateData);
    
    return () => {
      unsubscribeInterest();
      unsubscribeMember();
    };
  }, []);

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilNext(getTimeUntilNextInterest());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleSimulateInterest = () => {
    const result = simulateInterestPayment();
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

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
              <p className="font-bold text-success">{stats.vaultInterestRate}%</p>
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
                <p className="text-sm text-success/80">
                  {todaysInterest && formatInterestAmount(todaysInterest.interestAmount)}
                </p>
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
                Compounding at {stats.vaultInterestRate}% daily
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
        {todaysInterest ? (
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
                  ~{formatInterestAmount(getSystemStats().vaultInterestRate * 100)}
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
              ~{(stats.vaultInterestRate * 365).toFixed(0)}%
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
                  <p className="text-xs">Interest is calculated daily</p>
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
                            {formatDate(record.date)}
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
