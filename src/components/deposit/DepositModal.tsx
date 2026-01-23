import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Clock,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { usePublicConfig } from "@/hooks/usePublicConfig";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const { config, loading: configLoading } = usePublicConfig();
  const [step, setStep] = useState<"amount" | "qr" | "pending">("amount");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [copied, setCopied] = useState(false);
  const [clearingMinutes, setClearingMinutes] = useState(0);
  const [clearingSeconds, setClearingSeconds] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState("");

  // Generate random clearing time between 1-30 minutes
  const generateClearingTime = () => {
    return Math.floor(Math.random() * 30) + 1; // 1-30 minutes
  };

  // Generate reference number
  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ABC-DEP-${timestamp}-${random}`;
  };

  // Validate amount input
  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue)) {
      setAmountError("Please enter a valid amount");
      return false;
    }
    if (numValue < 100) {
      setAmountError("Minimum deposit is ₱100");
      return false;
    }
    if (numValue > 10000000) {
      setAmountError("Maximum deposit is ₱10,000,000");
      return false;
    }
    setAmountError("");
    return true;
  };

  // Handle amount change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = value.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(value);
    if (value) validateAmount(value);
  };

  // Handle proceed to QR step
  const handleProceedToQR = () => {
    if (validateAmount(amount)) {
      setReferenceNumber(generateReferenceNumber());
      setStep("qr");
    }
  };

  // Handle payment confirmation
  const handleConfirmPayment = () => {
    const minutes = generateClearingTime();
    setClearingMinutes(minutes);
    setClearingSeconds(0);
    setStep("pending");
  };

  // Countdown timer effect
  useEffect(() => {
    if (step !== "pending") return;

    const timer = setInterval(() => {
      setClearingSeconds((prev) => {
        if (prev === 0) {
          if (clearingMinutes === 0) {
            clearInterval(timer);
            return 0;
          }
          setClearingMinutes((m) => m - 1);
          return 59;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, clearingMinutes]);

  // Copy reference number
  const handleCopyReference = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset on close
  const handleClose = () => {
    setStep("amount");
    setAmount("");
    setAmountError("");
    setCopied(false);
    onClose();
  };

  // Format currency
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "₱0.00";
    return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card border-border p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-success to-emerald-600 p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5" />
              Deposit Funds
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 text-sm mt-1">
            {step === "amount" && "Enter the amount you wish to deposit"}
            {step === "qr" && "Scan QR code to complete payment"}
            {step === "pending" && "Payment is being processed"}
          </p>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* Step 1: Amount Input */}
            {step === "amount" && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Deposit Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-lg">
                      ₱
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={handleAmountChange}
                      className={`pl-8 bg-muted border-border text-xl font-mono h-14 ${
                        amountError ? "border-destructive" : ""
                      }`}
                    />
                  </div>
                  {amountError && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {amountError}
                    </p>
                  )}
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 5000, 10000].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => {
                        setAmount(quickAmount.toString());
                        validateAmount(quickAmount.toString());
                      }}
                      className="py-2 px-3 rounded-lg bg-muted/50 border border-border text-sm font-medium hover:border-success/50 hover:bg-success/10 transition-colors"
                    >
                      ₱{quickAmount.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Info Notice */}
                <Card className="p-3 bg-success/10 border-success/30">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-success">
                        6-Day Maturity Period
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deposits must age 144 hours before they can be used as
                        collateral for loans.
                      </p>
                    </div>
                  </div>
                </Card>

                <button
                  onClick={handleProceedToQR}
                  disabled={!amount || !!amountError}
                  className="w-full py-3 bg-gradient-to-r from-success to-emerald-600 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: QR Code Display */}
            {step === "qr" && (
              <motion.div
                key="qr"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Amount Summary */}
                <div className="text-center pb-4 border-b border-border">
                  <p className="text-sm text-muted-foreground">Amount to Pay</p>
                  <p className="text-3xl font-bold text-success balance-number">
                    {formatCurrency(amount)}
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl shadow-lg">
                    {configLoading ? (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      </div>
                    ) : config?.qrGatewayUrl ? (
                      <img
                        src={config.qrGatewayUrl}
                        alt="Payment QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg">
                        <QrCode className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Receiver Info */}
                {config && (
                  <div className="text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{config.receiverName}</p>
                    <p className="font-mono">{config.receiverPhone}</p>
                  </div>
                )}

                {/* Reference Number */}
                <Card className="p-3 bg-muted/30 border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Reference Number
                      </p>
                      <p className="font-mono text-sm text-foreground">
                        {referenceNumber}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyReference}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </Card>

                {/* Instructions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">
                    Payment Instructions:
                  </p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open your GCash, Maya, or banking app</li>
                    <li>Scan the QR code above</li>
                    <li>Enter the exact amount: {formatCurrency(amount)}</li>
                    <li>Include reference: {referenceNumber}</li>
                    <li>Complete the payment and click confirm below</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("amount")}
                    className="flex-1 py-3 bg-muted rounded-lg font-medium hover:bg-muted/70 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="flex-1 py-3 bg-gradient-to-r from-success to-emerald-600 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    I've Paid
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Pending/Clearing */}
            {step === "pending" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 text-center"
              >
                {/* Animated Loader */}
                <div className="flex justify-center py-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-success/20" />
                    <motion.div
                      className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-success"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-success animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Payment Clearing
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your deposit is being processed
                  </p>
                </div>

                {/* Timer */}
                <Card className="p-4 bg-primary/10 border-primary/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    Estimated Clearing Time
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-mono font-bold text-primary">
                      {String(clearingMinutes).padStart(2, "0")}:
                      {String(clearingSeconds).padStart(2, "0")}
                    </span>
                  </div>
                </Card>

                {/* Transaction Details */}
                <Card className="p-4 bg-muted/30 border-border text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium text-success">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-mono text-foreground text-xs">
                        {referenceNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-primary flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Pending
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Info Notice */}
                <p className="text-xs text-muted-foreground">
                  You will receive a notification once your deposit has cleared.
                  The 6-day maturity period will begin after clearing.
                </p>

                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-muted rounded-lg font-medium hover:bg-muted/70 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
