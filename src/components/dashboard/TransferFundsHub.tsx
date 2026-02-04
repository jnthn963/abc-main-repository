import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Building2, Wallet, Bitcoin, ArrowRight, 
  User, Search, Clock, AlertTriangle, Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMemberData } from "@/hooks/useMemberData";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

// Validation schemas
const amountSchema = z.number()
  .min(100, "Minimum amount is ₱100")
  .max(10000000, "Maximum amount is ₱10,000,000");

const memberIdSchema = z.string()
  .regex(/^ABC-\d{4}-\d{4}$/, "Invalid member ID format (ABC-YYYY-XXXX)");

// Philippine Banks
const banks = [
  { id: "bdo", name: "BDO", color: "#003399" },
  { id: "bpi", name: "BPI", color: "#B91C1C" },
  { id: "metrobank", name: "Metrobank", color: "#005C37" },
  { id: "landbank", name: "LandBank", color: "#00529B" },
  { id: "pnb", name: "PNB", color: "#DC2626" },
  { id: "rcbc", name: "RCBC", color: "#1E40AF" },
  { id: "securitybank", name: "Security Bank", color: "#7C3AED" },
  { id: "unionbank", name: "UnionBank", color: "#F97316" },
];

// E-Wallets
const ewallets = [
  { id: "gcash", name: "GCash", color: "#007DFE" },
  { id: "maya", name: "Maya", color: "#00D09E" },
  { id: "grabpay", name: "GrabPay", color: "#00B14F" },
  { id: "shopeepay", name: "ShopeePay", color: "#EE4D2D" },
];

// Top Cryptocurrencies
const cryptos = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", color: "#F7931A" },
  { id: "eth", name: "Ethereum", symbol: "ETH", color: "#627EEA" },
  { id: "usdt", name: "Tether", symbol: "USDT", color: "#26A17B" },
  { id: "bnb", name: "BNB", symbol: "BNB", color: "#F3BA2F" },
  { id: "sol", name: "Solana", symbol: "SOL", color: "#9945FF" },
  { id: "xrp", name: "XRP", symbol: "XRP", color: "#23292F" },
  { id: "ada", name: "Cardano", symbol: "ADA", color: "#0033AD" },
  { id: "doge", name: "Dogecoin", symbol: "DOGE", color: "#C3A634" },
  { id: "trx", name: "Tron", symbol: "TRX", color: "#FF0013" },
  { id: "matic", name: "Polygon", symbol: "MATIC", color: "#8247E5" },
];

type TabType = "banks" | "ewallets" | "crypto" | "internal";

interface TransferFundsHubProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransferFundsHub = ({ isOpen, onClose }: TransferFundsHubProps) => {
  const { user } = useAuth();
  const { memberData, refresh } = useMemberData();
  
  const [activeTab, setActiveTab] = useState<TabType>("banks");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Validate and sanitize amount input
  const handleAmountChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
    setAmount(formatted);
    setError("");
  };
  
  // Validate transfer and call edge function
  const handleContinue = async () => {
    if (!user || !memberData) return;
    
    const numAmount = parseFloat(amount);
    
    // Validate amount
    const amountResult = amountSchema.safeParse(numAmount);
    if (!amountResult.success) {
      setError(amountResult.error.errors[0].message);
      return;
    }
    
    // Check balance
    if (numAmount > memberData.vaultBalance) {
      setError("Insufficient vault balance");
      return;
    }
    
    // Validate member ID for internal transfers
    if (activeTab === "internal") {
      const memberIdResult = memberIdSchema.safeParse(memberId);
      if (!memberIdResult.success) {
        setError(memberIdResult.error.errors[0].message);
        return;
      }
    }
    
    try {
      setIsProcessing(true);
      
      // Call the process-transfer edge function
      const destName = activeTab === "internal" ? memberId : 
        [...banks, ...ewallets, ...cryptos].find(d => d.id === selectedDestination)?.name || "";
      
      const { data, error: fnError } = await supabase.functions.invoke('process-transfer', {
        body: {
          amount: Math.floor(numAmount * 100), // Convert to centavos
          destination: destName,
          destination_type: activeTab,
        },
      });
      
      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);
      
      toast({
        title: "Transfer Initiated",
        description: `₱${numAmount.toLocaleString()} will be transferred after 24-hour clearing`,
      });
      
      await refresh();
      
      // Reset and close
      setAmount("");
      setMemberId("");
      setSelectedDestination(null);
      setError("");
      onClose();
    } catch (err) {
      console.error('Transfer failed:', err);
      setError(err instanceof Error ? err.message : 'Transfer failed');
      toast({
        title: "Transfer Failed",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "banks", label: "Banks", icon: <Building2 className="w-4 h-4" /> },
    { id: "ewallets", label: "E-Wallets", icon: <Wallet className="w-4 h-4" /> },
    { id: "crypto", label: "Crypto", icon: <Bitcoin className="w-4 h-4" /> },
    { id: "internal", label: "Sovereign", icon: <User className="w-4 h-4" /> },
  ];

  const renderDestinationIcon = (item: { id: string; name: string; color: string; symbol?: string }) => (
    <motion.button
      key={item.id}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedDestination(item.id)}
      className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
        selectedDestination === item.id
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 bg-card"
      }`}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: item.color }}
      >
        {item.symbol || item.name.slice(0, 2).toUpperCase()}
      </div>
      <span className="text-xs font-medium text-foreground">{item.name}</span>
    </motion.button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#050505] border-[#D4AF37]/30 p-0 overflow-hidden">
        {/* Header - Sovereign Integrity Theme */}
        <div className="bg-gradient-to-r from-[#D4AF37] to-[#8B7500] p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#050505] font-bold uppercase tracking-[0.1em]">
              <Send className="w-5 h-5" />
              Release Funds Protocol
            </DialogTitle>
          </DialogHeader>
          <p className="text-[#050505]/80 text-sm mt-1">
            Dispatch capital to banks, e-wallets, crypto, or fellow sovereigns
          </p>
        </div>

        <div className="p-4 space-y-4 bg-[#050505]">
          {/* Balance Display */}
          {memberData && (
            <Card className="p-3 bg-muted/30 border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Liquid Vault Balance</span>
                <span className="font-bold text-success balance-number">
                  ₱{memberData.vaultBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedDestination(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border"
            />
          </div>

          {/* Destination Grid */}
          <div className="max-h-64 overflow-y-auto">
            {activeTab === "banks" && (
              <div className="grid grid-cols-4 gap-3">
                {banks
                  .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(renderDestinationIcon)}
              </div>
            )}

            {activeTab === "ewallets" && (
              <div className="grid grid-cols-4 gap-3">
                {ewallets
                  .filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(renderDestinationIcon)}
              </div>
            )}

            {activeTab === "crypto" && (
              <div className="grid grid-cols-5 gap-3">
                {cryptos
                  .filter((c) =>
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(renderDestinationIcon)}
              </div>
            )}

            {activeTab === "internal" && (
              <div className="space-y-4">
                <Card className="p-4 bg-muted/30 border-border">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Enter Member ID
                  </label>
                  <Input
                    placeholder="ABC-2026-XXXX"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                    className="bg-card border-border font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Internal transfers are instant with zero fees
                  </p>
                </Card>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* Amount Input (shows when destination selected) */}
          <AnimatePresence>
            {(selectedDestination || activeTab === "internal") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-3 border-t border-border"
              >
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Amount to Transfer
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      ₱
                    </span>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="pl-8 bg-muted border-border text-lg font-mono"
                    />
                  </div>
                </div>

                {/* 24-hour notice */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs text-foreground">
                    Transfers are subject to 24-hour clearing period
                  </span>
                </div>

                <button 
                  onClick={handleContinue}
                  disabled={isProcessing || !amount}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferFundsHub;
