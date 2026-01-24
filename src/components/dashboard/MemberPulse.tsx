import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, Send, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import PendingTransactions from "./PendingTransactions";
import MyLoansPanel from "@/components/lending/MyLoansPanel";
import InterestDisplay from "@/components/interest/InterestDisplay";
import { useMemberData } from "@/hooks/useMemberData";
import { useLoans } from "@/hooks/useLoans";

interface MemberPulseProps {
  onTransferClick?: () => void;
}

const MemberPulse = ({ onTransferClick }: MemberPulseProps) => {
  const { memberData, systemStats, loading } = useMemberData();
  const { myLoansAsBorrower } = useLoans();
  const [showLoansPanel, setShowLoansPanel] = useState(false);

  // Count active funded loans
  const activeLoansCount = myLoansAsBorrower.filter(l => l.status === 'funded').length;

  if (loading || !memberData) {
    return (
      <div className="space-y-4">
        <Card className="glass-card p-5 border-primary/20 animate-pulse">
          <div className="h-20 bg-muted/30 rounded" />
        </Card>
        <Card className="glass-card p-4 border-destructive/20 animate-pulse">
          <div className="h-12 bg-muted/30 rounded" />
        </Card>
      </div>
    );
  }

  const { vaultBalance, frozenBalance } = memberData;

  return (
    <div className="space-y-4">
      {/* Vault Balance Card - Polished Gold Theme */}
      <Card className="glass-card p-5 border-[#D4AF37]/30 bg-gradient-to-b from-[#1a1a1a]/80 to-[#0d0d0d]/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <span className="text-sm text-muted-foreground">Vault Balance</span>
          </div>
          <div className="flex items-center gap-1 text-[#D4AF37] text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            +{systemStats?.vaultInterestRate || 0.5}%
          </div>
        </div>
        <div 
          className="balance-number text-3xl mb-1"
          style={{
            background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 60%, #8B7500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ₱{vaultBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </div>
      </Card>

      {/* Frozen Balance - Obsidian Theme */}
      <Card className="glass-card p-4 border-destructive/20 bg-gradient-to-b from-[#1a1a1a]/60 to-[#0d0d0d]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-destructive/20 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Frozen (Collateral + Clearing)</p>
              <p className="balance-number text-lg text-destructive">
                ₱{frozenBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Pending Transactions with Clearing Timers */}
      <PendingTransactions />

      {/* Daily Interest Display */}
      <InterestDisplay />

      {/* Quick Actions - Gold Accent Theme */}
      <div className="grid grid-cols-2 gap-3" id="transfer-funds">
        <Card 
          className="glass-card p-4 border-[#D4AF37]/20 hover:border-[#D4AF37]/50 cursor-pointer transition-all group bg-gradient-to-b from-[#1a1a1a]/50 to-[#0d0d0d]/50"
          onClick={onTransferClick}
        >
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mb-2 group-hover:bg-[#D4AF37]/20 transition-colors">
            <Send className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <p className="text-sm font-medium">Transfer Funds</p>
          <p className="text-xs text-muted-foreground">Banks • E-Wallets</p>
        </Card>
        <Card 
          className="glass-card p-4 border-success/20 hover:border-success/50 cursor-pointer transition-all group bg-gradient-to-b from-[#1a1a1a]/50 to-[#0d0d0d]/50"
          onClick={() => setShowLoansPanel(true)}
        >
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-2 group-hover:bg-success/20 transition-colors">
            <FileText className="w-5 h-5 text-success" />
          </div>
          <p className="text-sm font-medium">My Loans</p>
          <p className="text-xs text-muted-foreground">
            Active: {activeLoansCount}
          </p>
        </Card>
      </div>

      {/* My Loans Panel */}
      <MyLoansPanel 
        isOpen={showLoansPanel} 
        onClose={() => setShowLoansPanel(false)} 
      />
    </div>
  );
};

export default MemberPulse;
