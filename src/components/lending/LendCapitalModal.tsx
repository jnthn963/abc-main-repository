/**
 * ABC Master Build: Lend Capital Modal
 * Move funds from E-Wallet to Lend Capital for +0.7% daily premium yield
 * Enforces 50% vault limit, whole peso amounts
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Wallet, ArrowRight, Lock, Sparkles, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemberData } from "@/hooks/useMemberData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LendCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLLATERAL_RATIO = 0.5; // 50% max lend limit
const MIN_LEND_AMOUNT = 100;

export default function LendCapitalModal({ isOpen, onClose }: LendCapitalModalProps) {
  const { memberData, optimisticUpdateBalance, refresh } = useMemberData();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vaultBalance = memberData?.vaultBalance || 0;
  const maxLendAmount = Math.floor(vaultBalance * COLLATERAL_RATIO);
  const parsedAmount = Math.floor(Number(amount) || 0);

  // Validation
  const isValidAmount = parsedAmount >= MIN_LEND_AMOUNT && parsedAmount <= maxLendAmount;
  const percentageOfMax = maxLendAmount > 0 ? (parsedAmount / maxLendAmount) * 100 : 0;

  const handleAmountChange = (value: string) => {
    // Only allow whole numbers (Whole Peso Mandate)
    const cleanValue = value.replace(/[^0-9]/g, '');
    setAmount(cleanValue);
    setError(null);
  };

  const handleMaxClick = () => {
    setAmount(maxLendAmount.toString());
    setError(null);
  };

  const handleLend = async () => {
    if (!isValidAmount || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    // Optimistic UI update (10ms latency target)
    optimisticUpdateBalance('vault', -parsedAmount);
    optimisticUpdateBalance('lending', parsedAmount);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('lend-capital', {
        body: { amount: parsedAmount }
      });

      if (fnError || !data?.success) {
        // Rollback optimistic update
        optimisticUpdateBalance('vault', parsedAmount);
        optimisticUpdateBalance('lending', -parsedAmount);
        
        setError(data?.error || fnError?.message || 'Failed to process lend request');
        return;
      }

      // Success - show celebration
      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00FF41]" />
          <span>₱{parsedAmount.toLocaleString()} moved to Lend Capital!</span>
        </div>,
        { description: 'Earning +0.7% daily premium yield' }
      );

      // Refresh data and close
      await refresh();
      setAmount("");
      onClose();

    } catch (err) {
      // Rollback optimistic update
      optimisticUpdateBalance('vault', parsedAmount);
      optimisticUpdateBalance('lending', -parsedAmount);
      setError('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#050505] border-[#00FF41]/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#00FF41]">
            <TrendingUp className="w-5 h-5" />
            Deploy Capital
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs text-muted-foreground">Liquid Vault</span>
              </div>
              <p className="text-lg font-bold text-[#D4AF37]">
                ₱{vaultBalance.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#00FF41]/10 border border-[#00FF41]/20">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-[#00FF41]" />
                <span className="text-xs text-muted-foreground">Max Deploy (50%)</span>
              </div>
              <p className="text-lg font-bold text-[#00FF41]">
                ₱{maxLendAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Deploy Amount (Whole Pesos)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37] font-bold">₱</span>
              <Input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="pl-8 pr-16 text-lg font-mono bg-[#0a0a0a] border-[#00FF41]/30 focus:border-[#00FF41]"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMaxClick}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs text-[#00FF41] hover:bg-[#00FF41]/20"
              >
                MAX
              </Button>
            </div>

            {/* Progress Bar */}
            {parsedAmount > 0 && (
              <div className="space-y-1">
                <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: percentageOfMax > 100 
                        ? 'hsl(0 100% 50%)' 
                        : 'linear-gradient(90deg, #00FF41, #00CC33)'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, percentageOfMax)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">
                  {percentageOfMax.toFixed(0)}% of max limit
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Yield Info */}
          <div className="p-3 rounded-lg bg-[#00FF41]/5 border border-[#00FF41]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00FF41]" />
                <span className="text-sm text-[#00FF41]">Yield Generation</span>
              </div>
              <span className="text-lg font-bold text-[#00FF41]">+0.7%/day</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Capital locked for deployment • Yield accrual at midnight
            </p>
          </div>

          {/* Transaction Preview */}
          {isValidAmount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-[#0a0a0a] border border-border/50"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You Deploy</span>
                <span className="font-bold text-[#D4AF37]">₱{parsedAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-center my-2">
                <ArrowRight className="w-4 h-4 text-[#00FF41]" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Daily Yield</span>
                <span className="font-bold text-[#00FF41]">
                  +₱{Math.floor(parsedAmount * 0.007).toLocaleString()}
                </span>
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleLend}
            disabled={!isValidAmount || isProcessing}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-[#00FF41] to-[#00CC33] hover:from-[#00CC33] hover:to-[#009922] text-[#050505] disabled:opacity-50"
          >
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <TrendingUp className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Deploy Capital
              </>
            )}
          </Button>

          {/* Minimum Notice */}
          <p className="text-[10px] text-center text-muted-foreground">
            Minimum: ₱100 • Max: 50% of Liquid Vault • Whole Pesos Only
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
