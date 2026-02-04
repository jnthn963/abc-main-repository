/**
 * Pending Transactions Component
 * Shows all transactions in 24-hour clearing state with countdown timers
 * Production version - fetches directly from Supabase ledger table
 */

import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowUpRight, ArrowDownRight, Send, DollarSign, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import ClearingTimer from "@/components/common/ClearingTimer";
import { useMemberData } from "@/hooks/useMemberData";

const PendingTransactions = () => {
  const { pendingTransactions, loading } = useMemberData();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-success" />;
      case 'withdrawal':
      case 'transfer_out':
        return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case 'transfer_in':
        return <Send className="w-4 h-4 text-primary" />;
      default:
        return <DollarSign className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'transfer_out': return 'Transfer Out';
      case 'transfer_in': return 'Transfer In';
      case 'loan_funded': return 'Loan Funded';
      case 'loan_received': return 'Loan Received';
      case 'vault_interest': return 'Interest';
      default: return 'Transaction';
    }
  };

  const isIncoming = (type: string) => {
    return ['deposit', 'transfer_in', 'loan_received', 'vault_interest'].includes(type);
  };

  if (loading) {
    return (
      <Card className="glass-card p-4 border-yellow-500/30">
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
          <span className="text-sm text-muted-foreground">Loading transactions...</span>
        </div>
      </Card>
    );
  }

  if (!pendingTransactions || pendingTransactions.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card p-4 border-[#D4AF37]/30 bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[#D4AF37]" />
        <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Clearing Queue</h3>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-medium">
          {pendingTransactions.length} pending
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {pendingTransactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-3 rounded-lg bg-muted/30 border border-border space-y-2"
            >
              {/* Transaction Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {getTransactionLabel(tx.type)}
                    </p>
                    {tx.destination && (
                      <p className="text-xs text-muted-foreground">
                        To: {tx.destination}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold balance-number ${
                    isIncoming(tx.type) ? 'text-success' : 'text-destructive'
                  }`}>
                    {isIncoming(tx.type) ? '+' : '-'}₱{tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {tx.referenceNumber}
                  </p>
                </div>
              </div>

              {/* Clearing Timer */}
              {tx.clearingEndsAt && (
                <ClearingTimer 
                  targetTime={new Date(tx.clearingEndsAt)}
                  size="sm"
                  showLabel={false}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        24-Hour Security Clearing Protocol Active
      </p>
    </Card>
  );
};

export default PendingTransactions;
