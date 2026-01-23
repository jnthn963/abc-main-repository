/**
 * Borrower Repayment Modal
 * Allows borrowers to repay funded loans via QR PH payment gateway
 * Releases collateral after successful repayment
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Unlock, Copy, CheckCircle, Clock, Loader2, AlertTriangle,
  Wallet, User, ArrowRight, Lock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { P2PLoan } from "@/hooks/useLoans";

interface BorrowerRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: P2PLoan | null;
  onRepaymentComplete?: (loanId: string) => void;
}

const BorrowerRepaymentModal = ({ isOpen, onClose, loan, onRepaymentComplete }: BorrowerRepaymentModalProps) => {
  const [step, setStep] = useState<'details' | 'qr' | 'pending' | 'success'>('details');
  const [referenceNumber, setReferenceNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [gateway, setGateway] = useState<{ qrCodeUrl: string | null; receiverName: string | null; receiverNumber: string | null }>({
    qrCodeUrl: null,
    receiverName: null,
    receiverNumber: null,
  });

  // Fetch gateway settings from public_config (accessible to all users)
  useEffect(() => {
    const fetchGateway = async () => {
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
    };
    fetchGateway();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('borrower-repayment-gateway')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'public_config' },
        () => fetchGateway()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Calculate amounts
  const totalRepayment = loan ? loan.principalAmount + loan.interestAmount : 0;
  const daysRemaining = loan?.dueAt 
    ? Math.max(0, Math.ceil((loan.dueAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  // Generate reference number
  const generateReferenceNumber = () => {
    return 'REP-' + Date.now().toString(36).toUpperCase() + '-' + 
           Math.random().toString(36).substring(2, 8).toUpperCase();
  };

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

  const handleConfirmPayment = async () => {
    if (!loan) return;

    try {
      // Call the process-repayment edge function
      const { data, error } = await supabase.functions.invoke('process-repayment', {
        body: { loan_id: loan.id },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Random clearing time between 1-5 seconds for demo
      const clearingSeconds = Math.floor(Math.random() * 4) + 1;
      setTimeRemaining(clearingSeconds);
      setStep('pending');

      toast({
        title: "Payment Processing",
        description: "Your repayment is being verified...",
      });
    } catch (err) {
      console.error('Repayment failed:', err);
      toast({
        title: "Repayment Failed",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    }
  };

  const handleComplete = () => {
    if (loan && onRepaymentComplete) {
      onRepaymentComplete(loan.id);
    }
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Wallet className="w-5 h-5 text-primary" />
            Repay Loan
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Loan Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-5 pt-4 space-y-4"
            >
              {/* Loan Status */}
              <Card className="p-4 bg-muted/30 border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-foreground">{loan.lenderAlias || 'Pending'}</p>
                      <p className="text-xs text-muted-foreground">Your Lender</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium px-2 py-1 rounded-full ${
                      daysRemaining <= 5 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-success/20 text-success'
                    }`}>
                      {daysRemaining} days left
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Principal</p>
                    <p className="font-bold text-foreground balance-number">
                      ₱{loan.principalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interest ({loan.interestRate}%)</p>
                    <p className="font-bold text-primary balance-number">
                      ₱{loan.interestAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Due Date Warning */}
              {daysRemaining <= 5 && (
                <Card className="p-4 bg-destructive/10 border-destructive/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                    <div>
                      <p className="font-medium text-destructive text-sm">
                        Payment Due Soon!
                      </p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Due on {loan.dueAt ? formatDate(loan.dueAt) : 'N/A'}. 
                        Failure to repay will trigger auto-repayment from Reserve Fund and forfeit your collateral.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Collateral Info */}
              <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-500 text-sm">
                      Collateral Will Be Released
                    </p>
                    <p className="text-xs text-yellow-500/80 mt-1">
                      Upon successful repayment, your frozen collateral of{' '}
                      <span className="font-bold">₱{loan.collateralAmount.toLocaleString()}</span>{' '}
                      will be returned to your vault.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Repayment Summary */}
              <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Principal</span>
                  <span className="font-medium">₱{loan.principalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest ({loan.interestRate}%)</span>
                  <span className="font-medium text-primary">+₱{loan.interestAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-primary/20">
                  <span className="font-medium text-foreground">Total to Pay</span>
                  <span className="font-bold text-xl text-destructive balance-number">
                    ₱{totalRepayment.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Collateral Return Preview */}
              <Card className="p-3 bg-success/10 border-success/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-success" />
                    <span className="text-sm text-muted-foreground">Collateral Released</span>
                  </div>
                  <span className="font-bold text-success balance-number">
                    +₱{loan.collateralAmount.toLocaleString()}
                  </span>
                </div>
              </Card>

              {/* Action Button */}
              <Button
                onClick={handleProceedToPayment}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-5 glow-gold"
              >
                <span className="flex items-center gap-2">
                  Repay Now
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
              <Card className="p-4 bg-destructive/10 border-destructive/30 text-center">
                <p className="text-sm text-muted-foreground">Total Repayment Amount</p>
                <p className="text-3xl font-bold text-destructive balance-number">
                  ₱{totalRepayment.toLocaleString()}
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
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  className="flex-1 bg-primary hover:bg-primary/80"
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
                Verifying your repayment...
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
                    <span className="font-bold balance-number">₱{totalRepayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lender</span>
                    <span className="font-mono">{loan.lenderAlias || 'N/A'}</span>
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
                Loan Repaid! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your loan has been successfully repaid and your collateral is released.
              </p>

              <Card className="p-4 bg-success/10 border-success/30 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-medium">₱{totalRepayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-success/30">
                    <span className="font-medium flex items-center gap-1">
                      <Unlock className="w-4 h-4 text-success" />
                      Collateral Released
                    </span>
                    <span className="font-bold text-xl text-success balance-number">
                      +₱{loan.collateralAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleComplete}
                className="w-full bg-success hover:bg-success/80 text-success-foreground font-semibold"
              >
                Return to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BorrowerRepaymentModal;
