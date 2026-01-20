/**
 * Lender Funding Modal
 * Allows lenders to fund loan requests via QR PH payment gateway
 * Includes Reserve Fund auto-repayment guarantee display
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Shield, Copy, CheckCircle, Clock, Loader2, AlertTriangle,
  Wallet, TrendingUp, User, Calendar, Info, ArrowRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getGatewaySettings } from "@/stores/gatewayStore";
import { getSystemStats, generateReferenceNumber } from "@/stores/memberStore";

export interface LoanListing {
  id: string;
  borrowerId: string;
  borrowerAlias: string;
  principalAmount: number;
  interestRate: number;
  duration: number;
  status: 'open' | 'funded' | 'repaid' | 'defaulted';
  createdAt: Date;
  collateralAmount: number;
}

interface LenderFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanListing | null;
  onFundingComplete?: (loanId: string) => void;
}

const LenderFundingModal = ({ isOpen, onClose, loan, onFundingComplete }: LenderFundingModalProps) => {
  const [step, setStep] = useState<'details' | 'qr' | 'pending' | 'success'>('details');
  const [referenceNumber, setReferenceNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [clearingTime, setClearingTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const gateway = getGatewaySettings();
  const systemStats = getSystemStats();

  // Calculate earnings
  const interestEarnings = loan ? loan.principalAmount * (loan.interestRate / 100) : 0;
  const totalReturn = loan ? loan.principalAmount + interestEarnings : 0;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setReferenceNumber(generateReferenceNumber());
      setCopied(false);
    }
  }, [isOpen]);

  // Countdown timer for clearing
  useEffect(() => {
    if (step === 'pending' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setStep('success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeRemaining]);

  const handleCopyReference = useCallback(() => {
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referenceNumber]);

  const handleProceedToPayment = () => {
    setStep('qr');
  };

  const handleConfirmPayment = () => {
    // Random clearing time between 1-30 minutes (in seconds)
    const clearingSeconds = Math.floor(Math.random() * 1740) + 60; // 60-1800 seconds
    setClearingTime(clearingSeconds);
    setTimeRemaining(clearingSeconds);
    setStep('pending');
  };

  const handleComplete = () => {
    if (loan && onFundingComplete) {
      onFundingComplete(loan.id);
    }
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Wallet className="w-5 h-5 text-success" />
            Fund Loan Request
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Loan Details & Guarantee */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-5 pt-4 space-y-4"
            >
              {/* Borrower Info */}
              <Card className="p-4 bg-muted/30 border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-foreground">{loan.borrowerAlias}</p>
                      <p className="text-xs text-muted-foreground">Borrower</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground balance-number">
                      ₱{loan.principalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Principal</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-bold text-success">{loan.interestRate}%</p>
                    <p className="text-[10px] text-muted-foreground">Interest</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{loan.duration}</p>
                    <p className="text-[10px] text-muted-foreground">Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary balance-number">
                      ₱{interestEarnings.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Your Earnings</p>
                  </div>
                </div>
              </Card>

              {/* Reserve Fund Guarantee */}
              <Card className="p-4 bg-success/10 border-success/30">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-success shrink-0" />
                  <div>
                    <p className="font-semibold text-success text-sm">
                      100% Auto-Repayment Guarantee
                    </p>
                    <p className="text-xs text-success/80 mt-1">
                      If the borrower fails to repay, the Reserve Fund automatically covers your principal + interest.
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <div>
                        <p className="text-[10px] text-success/60 uppercase tracking-wider">Reserve Fund</p>
                        <p className="font-bold text-success balance-number">
                          ₱{systemStats.reserveFund.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-success/60 uppercase tracking-wider">Coverage</p>
                        <p className="font-bold text-success">
                          {((systemStats.reserveFund / loan.principalAmount) * 100).toFixed(0)}x
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Collateral Lock */}
              <Card className="p-4 bg-muted/30 border-border">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      50% Collateral Locked
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Borrower has ₱{loan.collateralAmount.toLocaleString()} frozen as collateral (50% of their vault balance).
                    </p>
                  </div>
                </div>
              </Card>

              {/* Earnings Summary */}
              <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You Fund</span>
                  <span className="font-medium">₱{loan.principalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest Earned</span>
                  <span className="font-medium text-success">+₱{interestEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-primary/20">
                  <span className="font-medium text-foreground">Total Return</span>
                  <span className="font-bold text-xl text-primary balance-number">
                    ₱{totalReturn.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 pt-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-bold text-success">
                    +{loan.interestRate}% in {loan.duration} days
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleProceedToPayment}
                className="w-full bg-success hover:bg-success/80 text-success-foreground font-semibold py-5 glow-green"
              >
                <span className="flex items-center gap-2">
                  Fund This Loan
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </motion.div>
          )}

          {/* Step 2: QR Payment */}
          {step === 'qr' && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 pt-4 space-y-4"
            >
              {/* Amount to Pay */}
              <Card className="p-4 bg-success/10 border-success/30 text-center">
                <p className="text-sm text-muted-foreground">Amount to Fund</p>
                <p className="text-3xl font-bold text-success balance-number">
                  ₱{loan.principalAmount.toLocaleString()}
                </p>
              </Card>

              {/* QR Code Display */}
              <div className="flex flex-col items-center">
                {gateway.qrCodeUrl ? (
                  <div className="w-56 h-56 bg-white rounded-xl p-3 shadow-lg">
                    <img
                      src={gateway.qrCodeUrl}
                      alt="QR PH Payment"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-56 h-56 bg-muted rounded-xl flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">No QR Code Available</p>
                      <p className="text-xs">Contact admin</p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Scan with GCash, Maya, or any QR PH app
                </p>
              </div>

              {/* Receiver Info */}
              <Card className="p-3 bg-muted/30 border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Receiver</span>
                  <span className="font-medium">{gateway.receiverName}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Number</span>
                  <span className="font-medium font-mono">{gateway.receiverNumber}</span>
                </div>
              </Card>

              {/* Reference Number */}
              <Card className="p-3 bg-primary/10 border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Reference Number</p>
                    <p className="font-mono font-bold text-primary">{referenceNumber}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyReference}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Include this reference in your payment notes
                </p>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('details')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  className="flex-1 bg-success hover:bg-success/80"
                >
                  I've Paid
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Pending/Clearing */}
          {step === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 text-center"
            >
              <div className="relative w-20 h-20 mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Loader2 className="w-20 h-20 text-primary" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2">
                Payment Clearing
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Verifying your payment...
              </p>
              
              <div className="text-4xl font-mono font-bold text-primary mb-6">
                {formatTime(timeRemaining)}
              </div>

              <Card className="p-4 bg-muted/30 border-border text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono">{referenceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold balance-number">₱{loan.principalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Borrower</span>
                    <span className="font-mono">{loan.borrowerAlias}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Loan Funded! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                You've successfully funded this loan. Your expected return:
              </p>

              <Card className="p-4 bg-success/10 border-success/30 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Principal</span>
                    <span className="font-medium">₱{loan.principalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Interest</span>
                    <span className="font-medium text-success">+₱{interestEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-success/30">
                    <span className="font-medium">Total Return</span>
                    <span className="font-bold text-xl text-success balance-number">
                      ₱{totalReturn.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Expected return in {loan.duration} days</span>
              </div>

              <Card className="p-3 bg-primary/10 border-primary/30 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-success" />
                  <span className="text-muted-foreground">
                    Protected by Reserve Fund Auto-Repayment
                  </span>
                </div>
              </Card>

              <Button onClick={handleComplete} className="w-full bg-primary hover:bg-primary/80">
                Back to Marketplace
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default LenderFundingModal;
