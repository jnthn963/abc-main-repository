import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, Send, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import PendingTransactions from "./PendingTransactions";
import { getMemberData, subscribeMemberStore } from "@/stores/memberStore";
import { getLoans, subscribeLoanStore } from "@/stores/loanStore";
import MyLoansPanel from "@/components/lending/MyLoansPanel";
import InterestDisplay from "@/components/interest/InterestDisplay";

interface MemberPulseProps {
  onTransferClick?: () => void;
}

const MemberPulse = ({ onTransferClick }: MemberPulseProps) => {
  const [memberData, setMemberData] = useState(getMemberData());
  const [showLoansPanel, setShowLoansPanel] = useState(false);
  const [activeLoansCount, setActiveLoansCount] = useState(0);

  // Subscribe to member data changes
  useEffect(() => {
    const unsubscribe = subscribeMemberStore(() => {
      setMemberData(getMemberData());
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to loan data changes and count active loans
  useEffect(() => {
    const updateLoansCount = () => {
      const loans = getLoans();
      const member = getMemberData();
      const myActiveLoans = loans.filter(
        l => l.borrowerId === member.id && l.status === 'funded'
      );
      setActiveLoansCount(myActiveLoans.length);
    };

    updateLoansCount();
    const unsubscribe = subscribeLoanStore(updateLoansCount);
    return () => unsubscribe();
  }, []);

  const { vaultBalance, frozenBalance } = memberData;

  return (
    <div className="space-y-4">
      {/* Vault Balance Card */}
      <Card className="glass-card p-5 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Vault Balance</span>
          </div>
          <div className="flex items-center gap-1 text-success text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            +0.5%
          </div>
        </div>
        <div className="balance-number text-3xl text-success mb-1">
          ₱{vaultBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </div>
      </Card>

      {/* Frozen Balance */}
      <Card className="glass-card p-4 border-destructive/20">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3" id="transfer-funds">
        <Card 
          className="glass-card p-4 hover:border-primary/50 cursor-pointer transition-all group"
          onClick={onTransferClick}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium">Transfer Funds</p>
          <p className="text-xs text-muted-foreground">Banks • E-Wallets</p>
        </Card>
        <Card 
          className="glass-card p-4 hover:border-success/50 cursor-pointer transition-all group"
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