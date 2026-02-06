/**
 * Lender Funding Modal
 * Allows lenders to fund loan requests via QR PH payment gateway
 * ENHANCED: Mandatory proof of transfer upload before funding
 * Includes Reserve Fund auto-repayment guarantee display
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Copy, CheckCircle, Clock, Loader2, AlertTriangle,
  Wallet, TrendingUp, User, ArrowRight, Upload, Info, ShieldCheck
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useMemberData } from "@/hooks/useMemberData";
import { toast } from "@/hooks/use-toast";
import { usePollingRefresh } from "@/hooks/usePollingRefresh";
import LenderProofUpload from "./LenderProofUpload";
import LoanStatusBadge from "./LoanStatusBadge";
import { maskDisplayName } from "@/lib/maskName";

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
  const { systemStats, refresh } = useMemberData();
  
  const [step, setStep] = useState<'details' | 'upload' | 'qr' | 'pending' | 'success'>('details');
  const [referenceNumber, setReferenceNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [proofUploadPath, setProofUploadPath] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [gateway, setGateway] = useState<{ qrCodeUrl: string | null; receiverName: string | null; receiverNumber: string | null }>({
    qrCodeUrl: null,
    receiverName: null,
    receiverNumber: null,
  });

  // Fetch gateway settings from public_config (accessible to all users)
  const fetchGateway = useCallback(async () => {
    const { data } = await supabase
      .from('public_config')
      .select('qr_gateway_url, receiver_name, receiver_phone')
      .maybeSingle();
    
    if (data) {
      setGateway({
        qrCodeUrl: data.qr_gateway_url,
        receiverName: data.receiver_name,
        receiverNumber: data.receiver_phone,
      });
    }
  }, []);

  // Poll every 10s instead of realtime subscriptions
  usePollingRefresh(fetchGateway, {
    interval: 10000,
    enabled: isOpen,
    immediate: true,
  });

  // Calculate earnings
  const interestEarnings = loan ? loan.principalAmount * (loan.interestRate / 100) : 0;
  const totalReturn = loan ? loan.principalAmount + interestEarnings : 0;

  // Generate reference number
  const generateReferenceNumber = () => {
    return 'FUND-' + Date.now().toString(36).toUpperCase() + '-' + 
           Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setReferenceNumber(generateReferenceNumber());
      setCopied(false);
      setIsProcessing(false);
      setProofUploadPath(null);
      setUploadError(null);
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

  const handleProceedToUpload = () => {
    setStep('upload');
  };

  const handleUploadComplete = (path: string) => {
    setProofUploadPath(path);
    setUploadError(null);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setProofUploadPath(null);
  };

  const handleProceedToPayment = () => {
    if (!proofUploadPath) {
      setUploadError('Please upload proof of transfer first');
      return;
    }
    setStep('qr');
  };

  const handleConfirmPayment = async () => {
    if (!loan || !proofUploadPath) return;

    try {
      setIsProcessing(true);

      // Call the fund-loan edge function with proof of payment
      const { data, error } = await supabase.functions.invoke('fund-loan', {
        body: { 
          loan_id: loan.id,
          proof_of_payment_path: proofUploadPath 
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Short clearing time for demo (1-5 seconds)
      const clearingSeconds = Math.floor(Math.random() * 4) + 1;
      setTimeRemaining(clearingSeconds);
      setStep('pending');

      toast({
        title: "Funding Processing",
        description: "Your loan funding is being verified...",
      });

      // Refresh data
      await refresh();
    } catch (err) {
      console.error('Funding failed:', err);
      toast({
        title: "Funding Failed",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
      setIsProcessing(false);
    }
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
      <DialogContent className="sm:max-w-[500px] bg-[#050505] border-[#00FF41]/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2 text-[#00FF41] font-bold uppercase tracking-[0.1em]">
            <Wallet className="w-5 h-5 text-[#00FF41]" />
            Deploy Capital Protocol
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
                      ₱{Math.floor(interestEarnings).toLocaleString()}
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
                          ₱{(systemStats?.reserveFund || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-success/60 uppercase tracking-wider">Coverage</p>
                        <p className="font-bold text-success">
                          {systemStats?.reserveFund && loan.principalAmount 
                            ? `${Math.floor((systemStats.reserveFund / loan.principalAmount) * 100)}x`
                            : '∞'}
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
                  <span className="font-medium text-success">+₱{Math.floor(interestEarnings).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-primary/20">
                  <span className="font-medium text-foreground">Total Return</span>
                  <span className="font-bold text-xl text-primary balance-number">
                    ₱{Math.floor(totalReturn).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 pt-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-bold text-success">
                    +{loan.interestRate}% in {loan.duration} days
                  </span>
                </div>
              </div>

              {/* Action Button - Now goes to Upload step */}
              <Button
                onClick={handleProceedToUpload}
                className="w-full bg-[#00FF41] hover:bg-[#00FF41]/80 text-[#050505] font-semibold py-5"
              >
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Proceed to Upload Proof
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </motion.div>

          )}

          {/* Step 2: Upload Proof of Transfer (NEW) */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 pt-4 space-y-4"
            >
              {/* Amount Reminder */}
              <Card className="p-4 bg-[#D4AF37]/10 border-[#D4AF37]/30 text-center">
                <p className="text-sm text-muted-foreground">Funding Amount</p>
                <p className="text-3xl font-bold text-[#D4AF37] balance-number">
                  ₱{loan.principalAmount.toLocaleString()}
                </p>
              </Card>

              {/* Upload Instructions */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-[#D4AF37] uppercase tracking-wider">
                  <Upload className="w-4 h-4" />
                  Proof of Transfer Required
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot of your payment transaction as proof before confirming. 
                  This ensures transparency and protects both parties.
                </p>
              </div>

              {/* Upload Component */}
              <LenderProofUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                disabled={isProcessing}
              />

              {/* Collateral Info Tooltip */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs text-muted-foreground">
                    Protected by 50% Collateral Lock
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground hover:text-[#D4AF37] transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[#0a0a0a] border-[#D4AF37]/30">
                      <div className="space-y-2">
                        <p className="font-bold text-[#D4AF37] text-xs">Collateral-Backed Sovereignty</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          The borrower's 50% collateral is locked and continues earning 0.5% daily base yield. 
                          If they default, your capital is automatically recovered from this lock.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('details')}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  onClick={handleProceedToPayment}
                  className="flex-1 bg-[#00FF41] hover:bg-[#00FF41]/80 text-[#050505] font-semibold"
                  disabled={!proofUploadPath || isProcessing}
                >
                  {proofUploadPath ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Continue
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload First
                    </>
                  )}
                </Button>
              </div>
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
                  <span className="font-medium">{gateway.receiverName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Number</span>
                  <span className="font-medium font-mono">{gateway.receiverNumber || 'N/A'}</span>
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
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  className="flex-1 bg-success hover:bg-success/80"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "I've Paid"
                  )}
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
                    <span className="text-muted-foreground">Interest Earnings</span>
                    <span className="font-medium text-success">+₱{Math.floor(interestEarnings).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-success/30">
                    <span className="font-medium">Total Return</span>
                    <span className="font-bold text-xl text-success balance-number">
                      ₱{Math.floor(totalReturn).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">
                  Protected by Reserve Fund Auto-Repayment
                </span>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-success hover:bg-success/80 text-success-foreground font-semibold"
              >
                Return to Marketplace
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default LenderFundingModal;
