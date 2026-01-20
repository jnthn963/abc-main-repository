/**
 * Pending Transactions Component
 * Shows all transactions in 24-hour clearing state with countdown timers
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowUpRight, ArrowDownRight, Send, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import ClearingTimer from "@/components/common/ClearingTimer";
import { 
  getPendingTransactions, 
  subscribeMemberStore, 
  Transaction 
} from "@/stores/memberStore";

const PendingTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Initial load
    setTransactions(getPendingTransactions());

    // Subscribe to changes
    const unsubscribe = subscribeMemberStore(() => {
      setTransactions(getPendingTransactions());
    });

    return () => unsubscribe();
  }, []);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-success" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case 'transfer':
        return <Send className="w-4 h-4 text-primary" />;
      default:
        return <DollarSign className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'transfer': return 'Transfer';
      case 'loan_funded': return 'Loan Funded';
      case 'loan_received': return 'Loan Received';
      case 'interest': return 'Interest';
      default: return 'Transaction';
    }
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card p-4 border-yellow-500/30">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-yellow-500" />
        <h3 className="text-sm font-semibold text-foreground">Pending Transactions</h3>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium">
          {transactions.length} clearing
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {transactions.map((tx) => (
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
                    {tx.destinationName && (
                      <p className="text-xs text-muted-foreground">
                        {tx.destinationType}: {tx.destinationName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold balance-number ${
                    tx.type === 'deposit' || tx.type === 'loan_received' || tx.type === 'interest'
                      ? 'text-success' 
                      : 'text-destructive'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'loan_received' || tx.type === 'interest' ? '+' : '-'}
                    ₱{tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {tx.referenceNumber}
                  </p>
                </div>
              </div>

              {/* Clearing Timer */}
              <ClearingTimer 
                targetTime={tx.clearingEndsAt} 
                size="sm"
                showLabel={false}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        All transactions require 24 hours to clear for security
      </p>
    </Card>
  );
};

export default PendingTransactions;
