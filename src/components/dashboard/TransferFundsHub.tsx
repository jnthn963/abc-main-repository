import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Building2, Wallet, Bitcoin, ArrowRight, 
  User, Search, Clock, AlertTriangle 
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
import { amountSchema, memberIdSchema, createTransaction, getMemberData } from "@/stores/memberStore";

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
  const [activeTab, setActiveTab] = useState<TabType>("banks");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");
  
  const memberData = getMemberData();
  
  // Validate and sanitize amount input
  const handleAmountChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
    setAmount(formatted);
    setError("");
  };
  
  // Validate transfer
  const handleContinue = () => {
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
    
    // Create transaction with 24-hour clearing
    const destName = activeTab === "internal" ? memberId : 
      [...banks, ...ewallets, ...cryptos].find(d => d.id === selectedDestination)?.name || "";
    
    createTransaction('transfer', numAmount, activeTab, destName);
    
    // Reset and close
    setAmount("");
    setMemberId("");
    setSelectedDestination(null);
    setError("");
    onClose();
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "banks", label: "Banks", icon: <Building2 className="w-4 h-4" /> },
    { id: "ewallets", label: "E-Wallets", icon: <Wallet className="w-4 h-4" /> },
    { id: "crypto", label: "Crypto", icon: <Bitcoin className="w-4 h-4" /> },
    { id: "internal", label: "ABC Member", icon: <User className="w-4 h-4" /> },
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
      <DialogContent className="max-w-2xl bg-card border-border p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary-foreground">
              <Send className="w-5 h-5" />
              Transfer Funds
            </DialogTitle>
          </DialogHeader>
          <p className="text-primary-foreground/80 text-sm mt-1">
            Send to banks, e-wallets, crypto, or other Alpha members
          </p>
        </div>

        <div className="p-4 space-y-4">
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
                      type="number"
                      placeholder="0.00"
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

                <button className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-gold">
                  Continue
                  <ArrowRight className="w-4 h-4" />
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
