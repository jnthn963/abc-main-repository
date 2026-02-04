/**
 * Loan Request Modal
 * Implements 50% Collateral Engine and 6-Day Aging Rule
 * Now using Supabase database instead of localStorage
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, Lock, Percent, CheckCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemberData } from "@/hooks/useMemberData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoanRequestModal = ({ isOpen, onClose }: LoanRequestModalProps) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");

  const { user } = useAuth();
  const { 
    memberData, 
    systemStats, 
    areFundsAged, 
    getAgingTimeRemaining,
    calculateMaxLoan,
    refresh
  } = useMemberData();

  const [agingTimeRemaining, setAgingTimeRemaining] = useState(getAgingTimeRemaining());

  const maxLoan = calculateMaxLoan();
  const fundsAged = areFundsAged();
  const interestRate = systemStats?.borrowerCostRate || 15.0;

  // Update aging countdown
  useEffect(() => {
    if (!fundsAged) {
      const interval = setInterval(() => {
        setAgingTimeRemaining(getAgingTimeRemaining());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [fundsAged, getAgingTimeRemaining]);

  // Format aging time remaining
  const formatAgingTime = useMemo(() => {
    const days = Math.floor(agingTimeRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((agingTimeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((agingTimeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${days}d ${hours}h ${minutes}m`;
  }, [agingTimeRemaining]);

  // Calculate loan details
  const loanAmount = parseFloat(amount) || 0;
  const collateralRequired = loanAmount;
  const interestAmount = loanAmount * (interestRate / 100);
  const totalRepayment = loanAmount + interestAmount;

  // Validate amount on change
  const handleAmountChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
    
    setAmount(formatted);
    setError("");

    const numValue = parseFloat(formatted);
    if (numValue > maxLoan) {
      setError(`Maximum loan is ₱${maxLoan.toLocaleString()} (50% of vault balance)`);
    }
  };

  const handleSubmit = () => {
    if (loanAmount <= 0) {
      setError("Please enter a valid loan amount");
      return;
    }
    if (loanAmount > maxLoan) {
      setError(`Maximum loan is ₱${maxLoan.toLocaleString()} (50% of vault balance)`);
      return;
    }
    if (!fundsAged) {
      setError("Funds must age for 6 days before requesting a loan");
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!user || !memberData) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Call request-loan edge function
      const { data, error: fnError } = await supabase.functions.invoke('request-loan', {
        body: {
          amount: Math.round(loanAmount * 100), // Convert to centavos
        },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setReferenceNumber(data.reference_number);
        await refresh();
        setStep('success');
        toast.success("Loan request submitted successfully!");
      } else {
        throw new Error(data?.error || "Failed to create loan request");
      }
    } catch (err) {
      console.error("Loan request failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create loan request");
      toast.error("Failed to submit loan request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setAmount("");
    setError("");
    setReferenceNumber("");
    onClose();
  };

  if (!memberData || !systemStats) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Lock className="w-5 h-5 text-primary" />
            Request Liquidity
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-5 pt-4"
            >
              {/* 6-Day Aging Rule Warning */}
              {!fundsAged && (
                <Card className="p-4 mb-4 bg-yellow-500/10 border-yellow-500/30">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-500 text-sm">
                        6-Day Aging Rule Active
                      </p>
                      <p className="text-xs text-yellow-500/70 mt-1">
                        Funds must age for 144 hours before requesting a loan.
                      </p>
                      <div className="mt-2 text-lg font-bold text-yellow-500 font-mono">
                        {formatAgingTime} remaining
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Vault & Collateral Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="p-3 bg-muted/30 border-border">
                  <p className="text-xs text-muted-foreground">Vault Holdings</p>
                  <p className="text-lg font-bold text-success balance-number">
                    ₱{memberData.vaultBalance.toLocaleString()}
                  </p>
                </Card>
                <Card className="p-3 bg-muted/30 border-border">
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Max Loan (50%)</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">50% collateral rule ensures 100% coverage</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-lg font-bold text-primary balance-number">
                    ₱{maxLoan.toLocaleString()}
                  </p>
                </Card>
              </div>

              {/* Loan Amount Input */}
              <div className="space-y-2 mb-4">
                <label className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>Loan Amount</span>
                  <span className="text-primary text-xs">
                    Interest Rate: {interestRate}% / 30 days
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    ₱
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 text-lg font-mono bg-muted/30 border-border focus:border-primary/50"
                    disabled={!fundsAged}
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mb-4">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => {
                      const val = (maxLoan * pct / 100).toFixed(2);
                      setAmount(val);
                      setError("");
                    }}
                    className="flex-1 py-2 text-xs bg-muted/50 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    disabled={!fundsAged}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Loan Summary */}
              {loanAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border text-sm"
                >
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Principal</span>
                    <span className="font-medium">₱{loanAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest ({interestRate}%)</span>
                    <span className="font-medium text-primary">+₱{interestAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collateral Locked</span>
                    <span className="font-medium text-destructive">₱{collateralRequired.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-medium">Total Repayment</span>
                    <span className="font-bold text-lg">₱{totalRepayment.toLocaleString()}</span>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!fundsAged || loanAmount <= 0 || loanAmount > maxLoan}
                className="w-full mt-4 bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-5"
              >
                {!fundsAged ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Aging protocol active (6 days)
                  </span>
                ) : (
                  "Request Liquidity"
                )}
              </Button>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 pt-4"
            >
              <Card className="p-4 mb-4 bg-primary/10 border-primary/30">
                <div className="flex items-start gap-3">
                  <Percent className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Confirm Loan Request</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your collateral (₱{collateralRequired.toLocaleString()}) will be frozen until repayment.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Loan Amount</span>
                  <span className="font-bold">₱{loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span className="font-bold text-primary">{interestRate}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-bold">30 Days</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Total Repayment</span>
                  <span className="font-bold text-lg">₱{totalRepayment.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1 mb-4"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {error}
                </motion.p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-success hover:bg-success/80"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Confirm Request"
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Liquidity Request Verified
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your request for ₱{loanAmount.toLocaleString()} is now listed in the marketplace.
              </p>
              {referenceNumber && (
                <p className="text-xs font-mono text-primary mb-6">
                  Ref: {referenceNumber}
                </p>
              )}
              <Button onClick={handleClose} className="bg-primary hover:bg-primary/80">
                Return to Hub
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default LoanRequestModal;
