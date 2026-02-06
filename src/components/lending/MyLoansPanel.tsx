/**
 * My Loans Panel
 * Shows borrower's active loans with repayment options
 * ENHANCED: Status badges, name masking, mobile collapsible UI
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Clock, AlertTriangle, CheckCircle, 
  User, Lock, ArrowRight, ChevronDown, ChevronUp, Info, ShieldCheck
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLoans, type P2PLoan } from "@/hooks/useLoans";
import BorrowerRepaymentModal from "./BorrowerRepaymentModal";
import LoanStatusBadge, { getDaysRemaining } from "./LoanStatusBadge";
import { maskDisplayName } from "@/lib/maskName";

interface MyLoansPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyLoansPanel = ({ isOpen, onClose }: MyLoansPanelProps) => {
  const { myLoansAsBorrower, loading, refresh } = useLoans();
  const [selectedLoan, setSelectedLoan] = useState<P2PLoan | null>(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const handleRepayClick = (loan: P2PLoan) => {
    setSelectedLoan(loan);
    setShowRepaymentModal(true);
  };

  const handleRepaymentComplete = async () => {
    await refresh();
    setShowRepaymentModal(false);
    setSelectedLoan(null);
  };

  const toggleExpand = (loanId: string) => {
    setExpandedLoanId(expandedLoanId === loanId ? null : loanId);
  };

  const activeFundedLoans = myLoansAsBorrower.filter(l => l.status === 'funded');
  const pendingLoans = myLoansAsBorrower.filter(l => l.status === 'open');
  const completedLoans = myLoansAsBorrower.filter(l => l.status === 'repaid' || l.status === 'defaulted');

  // Loan Card Component with collapsible details
  const LoanCard = ({ loan, showRepayButton = false }: { loan: P2PLoan; showRepayButton?: boolean }) => {
    const isExpanded = expandedLoanId === loan.id;
    const daysRemaining = loan.dueAt ? getDaysRemaining(loan.dueAt) : undefined;

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(loan.id)}>
        <Card className="bg-muted/30 border-border overflow-hidden">
          {/* Header - Always visible */}
          <CollapsibleTrigger className="w-full">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-mono font-bold text-sm">
                    {loan.lenderAlias ? maskDisplayName(loan.lenderAlias) : 'Pending...'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Ref: {loan.referenceNumber}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-sm balance-number">₱{loan.principalAmount.toLocaleString()}</p>
                  <LoanStatusBadge 
                    status={loan.status} 
                    daysRemaining={daysRemaining}
                    size="sm"
                  />
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Expanded Details */}
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 pb-4 space-y-3 border-t border-border/50"
            >
              {/* Financial Details Grid */}
              <div className="grid grid-cols-3 gap-2 pt-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Principal</p>
                  <p className="font-bold text-sm balance-number">₱{loan.principalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Interest</p>
                  <p className="font-bold text-sm text-[#D4AF37] balance-number">+₱{loan.interestAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Total Due</p>
                  <p className="font-bold text-sm text-destructive balance-number">
                    ₱{(loan.principalAmount + loan.interestAmount).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Collateral Info with Tooltip */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs text-[#D4AF37]">
                    Collateral Locked: ₱{loan.collateralAmount.toLocaleString()}
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[#0a0a0a] border-[#D4AF37]/30">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                          <span className="font-bold text-[#D4AF37] text-xs">Collateral-Backed Sovereignty</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Your 50% collateral remains locked until loan settlement. 
                          This frozen balance <span className="text-[#00FF41] font-semibold">continues earning 0.5% daily base yield</span> while secured.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Auto-Repay Warning */}
              {loan.autoRepayTriggered && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-destructive">
                    Auto-settled from Reserve Fund
                  </span>
                </div>
              )}

              {/* Action Button */}
              {showRepayButton && loan.status === 'funded' && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRepayClick(loan);
                  }}
                  className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-[#050505] font-bold"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Settle Loan
                </Button>
              )}
            </motion.div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

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
                <div className="w-8 h-8 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Loading positions...</p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3 bg-[#00FF41]/10 border-[#00FF41]/30 text-center">
                    <p className="text-2xl font-bold text-[#00FF41]">{activeFundedLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
                  </Card>
                  <Card className="p-3 bg-yellow-500/10 border-yellow-500/30 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{pendingLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Waiting</p>
                  </Card>
                  <Card className="p-3 bg-success/10 border-success/30 text-center">
                    <p className="text-2xl font-bold text-success">{completedLoans.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Settled</p>
                  </Card>
                </div>

                {/* Active Loans (need repayment) */}
                {activeFundedLoans.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#00FF41] uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4 text-[#00FF41]" />
                      Active Positions - Settlement Protocol
                    </h3>
                    <div className="space-y-2">
                      {activeFundedLoans.map((loan) => (
                        <LoanCard key={loan.id} loan={loan} showRepayButton />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Loans (waiting for funding) */}
                {pendingLoans.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-500 uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      Pending - Awaiting Lender
                    </h3>
                    <div className="space-y-2">
                      {pendingLoans.map((loan) => (
                        <LoanCard key={loan.id} loan={loan} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Loans */}
                {completedLoans.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-success uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Completed Positions
                    </h3>
                    <div className="space-y-2">
                      {completedLoans.map((loan) => (
                        <LoanCard key={loan.id} loan={loan} />
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
