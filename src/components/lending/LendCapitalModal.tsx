/**
 * ABC Master Build: Lend Capital Modal
 * Move funds from E-Wallet to Lend Capital for +0.5% daily synergy yield
 * Total Daily Synergy: 0.5% Base + 0.5% Lending = 1.0%
 * Enforces 50% vault limit, whole peso amounts
 * Includes confidence-boosting Auto-Repayment messaging
 * LIQUIDITY PROTOCOL: 50% Collateral-Backed Sovereignty Rules
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Wallet, ArrowRight, Lock, Sparkles, AlertCircle, Shield, CheckCircle, Info, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemberData } from "@/hooks/useMemberData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AutoRepaymentTooltip from "./AutoRepaymentTooltip";

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
        { description: 'Earning +0.5% daily synergy yield (1.0% total)' }
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
          <DialogTitle className="flex items-center gap-2 text-[#00FF41] font-bold uppercase tracking-[0.1em]">
            <TrendingUp className="w-5 h-5" />
            Deploy Capital Protocol
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Balance Display with Collateral-Backed Sovereignty */}
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-[#00FF41]/60 hover:text-[#00FF41] transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[#0a0a0a] border-[#00FF41]/30">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#00FF41]" />
                          <span className="font-bold text-[#00FF41] text-xs">Collateral-Backed Sovereignty</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          The 50% Liquidity Rule ensures 50% of your vault remains liquid at all times. 
                          This creates a fully-reserved system where deployed capital is always backed.
                        </p>
                        <p className="text-[9px] text-[#D4AF37]">
                          ✓ Your remaining 50% continues earning 0.5% daily base yield
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

          {/* Yield Info - Sovereign Protocol */}
          <div className="p-3 rounded-lg bg-[#00FF41]/5 border border-[#00FF41]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00FF41]" />
                <span className="text-sm text-[#00FF41] uppercase tracking-wider">Synergy Protocol</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#00FF41]">+0.5%/day</span>
                <p className="text-[9px] text-[#00FF41]/60">+1.0% total</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              0.5% Base Yield + 0.5% Lending Synergy = 1.0% Daily Total
            </p>
          </div>

          {/* Auto-Repayment Confidence Booster */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-[#00FF41]/10 via-[#00FF41]/5 to-transparent border border-[#00FF41]/30 relative overflow-hidden">
            {/* Animated glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FF41]/10 via-transparent to-transparent animate-pulse opacity-30" />
            
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00FF41]/20 border border-[#00FF41]/40 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-[#00FF41]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xs font-bold text-[#00FF41] uppercase tracking-wider">
                    100% Protected Capital
                  </h4>
                  <CheckCircle className="w-3 h-3 text-[#00FF41]" />
                </div>
                <p className="text-[10px] text-[#00FF41]/70 leading-relaxed mb-2">
                  Your deployed capital is backed by the <span className="font-semibold text-[#00FF41]">Reserve Fund Auto-Repayment System</span>. 
                  If any borrower defaults, you receive your full principal + interest automatically.
                </p>
                <div className="flex items-center justify-between">
                  <AutoRepaymentTooltip />
                  <div className="flex items-center gap-2 text-[9px] text-[#00FF41]/60">
                    <Shield className="w-3 h-3" />
                    <span>28-Day Settlement</span>
                  </div>
                </div>
              </div>
            </div>
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
                <span className="text-muted-foreground">Daily Synergy Yield</span>
                <span className="font-bold text-[#00FF41]">
                  +₱{Math.floor(parsedAmount * 0.005).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground/70 mt-1">
                <span>(Total: +₱{Math.floor(parsedAmount * 0.01).toLocaleString()}/day with base yield)</span>
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleLend}
            disabled={!isValidAmount || isProcessing}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-[#00FF41] to-[#00CC33] hover:from-[#00CC33] hover:to-[#009922] text-[#050505] uppercase tracking-[0.1em] disabled:opacity-50"
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
                Execute Protocol
              </>
            )}
          </Button>

          {/* Minimum Notice with Collateral-Backed Sovereignty */}
          <div className="text-center space-y-1">
            <p className="text-[10px] text-muted-foreground">
              Minimum: ₱100 • Max: 50% of Liquid Vault • Whole Pesos Only
            </p>
            <p className="text-[9px] text-[#D4AF37]/60 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Collateral-Backed Sovereignty • 50% Liquidity Reserve Maintained</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
