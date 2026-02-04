/**
 * My Loans Panel
 * Shows borrower's active loans with repayment options
 * Now using Supabase database instead of localStorage
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Clock, AlertTriangle, CheckCircle, 
  User, Lock, ArrowRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLoans, type P2PLoan } from "@/hooks/useLoans";
import BorrowerRepaymentModal from "./BorrowerRepaymentModal";

interface MyLoansPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyLoansPanel = ({ isOpen, onClose }: MyLoansPanelProps) => {
  const { myLoansAsBorrower, loading, refresh } = useLoans();
  const [selectedLoan, setSelectedLoan] = useState<P2PLoan | null>(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);

  const handleRepayClick = (loan: P2PLoan) => {
    setSelectedLoan(loan);
    setShowRepaymentModal(true);
  };

  const handleRepaymentComplete = async () => {
    await refresh();
    setShowRepaymentModal(false);
    setSelectedLoan(null);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysRemaining = (dueAt: Date): number => {
    return Math.max(0, Math.ceil((dueAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  };

  const getStatusBadge = (loan: P2PLoan) => {
    switch (loan.status) {
      case 'open':
        return (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500">
            Pending Funding
          </span>
        );
      case 'funded':
        const days = loan.dueAt ? getDaysRemaining(loan.dueAt) : 0;
        return (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            days <= 5 
              ? 'bg-destructive/20 text-destructive' 
              : 'bg-primary/20 text-primary'
          }`}>
            {days} days left
          </span>
        );
      case 'repaid':
        return (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-success/20 text-success flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Repaid
          </span>
        );
      case 'defaulted':
        return (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/20 text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Defaulted
          </span>
        );
      default:
        return null;
    }
  };

  const activeFundedLoans = myLoansAsBorrower.filter(l => l.status === 'funded');
  const pendingLoans = myLoansAsBorrower.filter(l => l.status === 'open');
  const completedLoans = myLoansAsBorrower.filter(l => l.status === 'repaid' || l.status === 'defaulted');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px] bg-[#050505] border-[#D4AF37]/30 p-0 overflow-hidden max-h-[85vh] overflow-y-auto">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="flex items-center gap-2 text-[#D4AF37] font-bold uppercase tracking-[0.1em]">
              <FileText className="w-5 h-5 text-[#D4AF37]" />
              Sovereign Liquidity Ledger
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 pt-4 space-y-4">
            {loading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Loading loans...</p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3 bg-primary/10 border-primary/30 text-center">
                    <p className="text-2xl font-bold text-primary">{activeFundedLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
                  </Card>
                  <Card className="p-3 bg-yellow-500/10 border-yellow-500/30 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{pendingLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
                  </Card>
                  <Card className="p-3 bg-success/10 border-success/30 text-center">
                    <p className="text-2xl font-bold text-success">{completedLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Completed</p>
                  </Card>
                </div>

                {/* Active Loans (need repayment) */}
                {activeFundedLoans.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-[#D4AF37] uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      Active Positions - Settlement Protocol
                    </h3>
                    <div className="space-y-2">
                      {activeFundedLoans.map((loan) => (
                        <Card key={loan.id} className="p-4 bg-muted/30 border-border hover:border-primary/50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Lender</p>
                                <p className="font-mono font-medium text-sm">{loan.lenderAlias}</p>
                              </div>
                            </div>
                            {getStatusBadge(loan)}
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Principal</p>
                              <p className="font-bold text-sm balance-number">₱{loan.principalAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Interest</p>
                              <p className="font-bold text-sm text-primary balance-number">+₱{loan.interestAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Total Due</p>
                              <p className="font-bold text-sm text-destructive balance-number">
                                ₱{(loan.principalAmount + loan.interestAmount).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Lock className="w-3 h-3" />
                              Collateral: ₱{loan.collateralAmount.toLocaleString()}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleRepayClick(loan)}
                              className="bg-primary hover:bg-primary/80 text-xs"
                            >
                              Settle
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Loans (waiting for funding) */}
                {pendingLoans.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Pending - Waiting for Lender
                    </h3>
                    <div className="space-y-2">
                      {pendingLoans.map((loan) => (
                        <Card key={loan.id} className="p-4 bg-yellow-500/5 border-yellow-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-mono text-sm">Ref: {loan.referenceNumber}</p>
                            {getStatusBadge(loan)}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Amount</p>
                              <p className="font-bold balance-number">₱{loan.principalAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Interest</p>
                              <p className="font-bold text-primary">{loan.interestRate}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                              <p className="font-bold">{loan.duration} days</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Loans */}
                {completedLoans.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Completed Loans
                    </h3>
                    <div className="space-y-2">
                      {completedLoans.map((loan) => (
                        <Card key={loan.id} className="p-3 bg-muted/20 border-border opacity-75">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-xs text-muted-foreground">{loan.referenceNumber}</p>
                              <p className="font-bold text-sm balance-number">₱{loan.principalAmount.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {loan.autoRepayTriggered && (
                                <span className="text-[10px] text-destructive">Reserve Fund Used</span>
                              )}
                              {getStatusBadge(loan)}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {myLoansAsBorrower.length === 0 && (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No positions yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Request liquidity from the marketplace to get started
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Repayment Modal */}
      <BorrowerRepaymentModal
        isOpen={showRepaymentModal}
        onClose={() => {
          setShowRepaymentModal(false);
          setSelectedLoan(null);
        }}
        loan={selectedLoan}
        onRepaymentComplete={handleRepaymentComplete}
      />
    </>
  );
};

export default MyLoansPanel;
