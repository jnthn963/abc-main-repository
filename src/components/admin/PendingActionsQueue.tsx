import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  HandCoins,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { usePollingRefresh } from "@/hooks/usePollingRefresh";
import DepositReceiptViewer from "./DepositReceiptViewer";

interface PendingAction {
  action_type: string;
  id: string;
  user_id: string;
  user_name: string | null;
  member_id: string;
  amount: number;
  reference_number: string;
  created_at: string;
  approval_status: string;
  description: string | null;
  interest_rate: number | null;
  collateral_amount: number | null;
  proof_of_payment_url: string | null;
}

const PendingActionsQueue = () => {
  const { user } = useAuth();
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<PendingAction | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPendingActions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Query ledger for pending items (including proof_of_payment_url)
      const { data: ledgerPending } = await supabase
        .from('ledger')
        .select(`
          id,
          user_id,
          type,
          amount,
          reference_number,
          created_at,
          approval_status,
          description,
          destination,
          proof_of_payment_url
        `)
        .eq('approval_status', 'pending_review')
        .order('created_at', { ascending: false });

      // Query loans for pending items
      const { data: loansPending } = await supabase
        .from('p2p_loans')
        .select(`
          id,
          borrower_id,
          lender_id,
          principal_amount,
          interest_rate,
          collateral_amount,
          reference_number,
          created_at,
          funded_at,
          approval_status,
          status
        `)
        .eq('approval_status', 'pending_review')
        .order('created_at', { ascending: false });

      // Gather unique user IDs for profile lookup
      const userIds = new Set<string>();
      (ledgerPending || []).forEach((item: any) => userIds.add(item.user_id));
      (loansPending || []).forEach((item: any) => userIds.add(item.borrower_id));

      // Fetch profiles for all user IDs
      let profilesMap: Record<string, { display_name: string; member_id: string }> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, member_id')
          .in('id', Array.from(userIds));
        
        (profiles || []).forEach((p: any) => {
          profilesMap[p.id] = { display_name: p.display_name, member_id: p.member_id };
        });
      }

      const actions: PendingAction[] = [];

      // Transform ledger items
      (ledgerPending || []).forEach((item: any) => {
        const profile = profilesMap[item.user_id];
        const actionType = item.type === 'deposit' ? 'deposit' : 
                          item.type === 'withdrawal' ? 'withdrawal' : 'transfer';
        actions.push({
          action_type: actionType,
          id: item.id,
          user_id: item.user_id,
          user_name: profile?.display_name || 'Unknown',
          member_id: profile?.member_id || 'N/A',
          amount: Number(item.amount),
          reference_number: item.reference_number,
          created_at: item.created_at,
          approval_status: item.approval_status,
          description: item.destination || item.description,
          interest_rate: null,
          collateral_amount: null,
          proof_of_payment_url: item.proof_of_payment_url || null,
        });
      });

      // Transform loan items
      (loansPending || []).forEach((item: any) => {
        const profile = profilesMap[item.borrower_id];
        const actionType = item.status === 'open' ? 'loan_request' : 'loan_funding';
        actions.push({
          action_type: actionType,
          id: item.id,
          user_id: item.borrower_id,
          user_name: profile?.display_name || 'Unknown',
          member_id: profile?.member_id || 'N/A',
          amount: Number(item.principal_amount),
          reference_number: item.reference_number,
          created_at: item.created_at || item.funded_at,
          approval_status: item.approval_status,
          description: null,
          interest_rate: Number(item.interest_rate),
          collateral_amount: Number(item.collateral_amount),
          proof_of_payment_url: null,
        });
      });

      // Sort by created_at
      actions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPendingActions(actions);
    } catch (err) {
      console.error('Failed to fetch pending actions:', err);
      toast({
        title: "Error",
        description: "Failed to load pending actions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 10s instead of realtime subscriptions
  usePollingRefresh(fetchPendingActions, {
    interval: 10000,
    enabled: true,
    immediate: true,
  });

  const handleApprove = async (action: PendingAction) => {
    if (!user) return;
    setProcessing(action.id);

    try {
      const { data, error } = await supabase.rpc('governor_approve_action', {
        p_governor_id: user.id,
        p_action_type: action.action_type,
        p_action_id: action.id,
        p_approve: true,
        p_rejection_reason: null,
      });

      if (error) throw error;

      toast({
        title: "Approved",
        description: `${action.action_type.replace('_', ' ')} for ${action.member_id} has been approved.`,
      });

      fetchPendingActions();
    } catch (err: any) {
      console.error('Approval failed:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to approve action",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!user || !rejectModal) return;
    setProcessing(rejectModal.id);

    try {
      const { error } = await supabase.rpc('governor_approve_action', {
        p_governor_id: user.id,
        p_action_type: rejectModal.action_type,
        p_action_id: rejectModal.id,
        p_approve: false,
        p_rejection_reason: rejectReason || 'Rejected by Governor',
      });

      if (error) throw error;

      toast({
        title: "Rejected",
        description: `${rejectModal.action_type.replace('_', ' ')} for ${rejectModal.member_id} has been rejected.`,
      });

      setRejectModal(null);
      setRejectReason("");
      fetchPendingActions();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to reject action",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownRight className="w-4 h-4 text-success" />;
      case 'withdrawal': return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case 'transfer': return <DollarSign className="w-4 h-4 text-primary" />;
      case 'loan_request': return <HandCoins className="w-4 h-4 text-amber-500" />;
      case 'loan_funding': return <HandCoins className="w-4 h-4 text-success" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'transfer': return 'Transfer';
      case 'loan_request': return 'Loan Request';
      case 'loan_funding': return 'Loan Funding';
      default: return type;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-success/10 border-success/30 text-success';
      case 'withdrawal': return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'transfer': return 'bg-primary/10 border-primary/30 text-primary';
      case 'loan_request': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      case 'loan_funding': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
      default: return 'bg-muted/10 border-muted/30 text-muted-foreground';
    }
  };

  return (
    <Card className="p-5 bg-card/50 border-border h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-foreground">Pending Actions Queue</h2>
          {pendingActions.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-500 rounded-full">
              {pendingActions.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchPendingActions}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading pending actions...</p>
          </div>
        ) : pendingActions.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-success/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All actions have been processed</p>
          </div>
        ) : (
          <AnimatePresence>
            {pendingActions.map((action) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getActionColor(action.action_type)}`}>
                        {getActionIcon(action.action_type)}
                        {getActionLabel(action.action_type)}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {action.reference_number}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Member</p>
                        <p className="font-medium truncate">{action.user_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{action.member_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-lg font-bold text-primary balance-number">
                          ₱{(action.amount / 100).toLocaleString()}
                        </p>
                        {action.collateral_amount && (
                          <p className="text-xs text-muted-foreground">
                            Collateral: ₱{(action.collateral_amount / 100).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {action.description && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        Destination: {action.description}
                      </p>
                    )}

                    {/* Proof of Payment for Deposits */}
                    {action.action_type === 'deposit' && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">Proof of Payment</span>
                        </div>
                        <DepositReceiptViewer
                          receiptPath={action.proof_of_payment_url}
                          referenceNumber={action.reference_number}
                          memberName={action.user_name || 'Member'}
                          compact
                        />
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      Submitted: {new Date(action.created_at).toLocaleString('en-PH')}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(action)}
                      disabled={processing === action.id}
                      className="bg-success hover:bg-success/80 text-success-foreground glow-green"
                    >
                      {processing === action.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          APPROVE
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejectModal(action)}
                      disabled={processing === action.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      REJECT
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Reject Modal */}
      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Reject Transaction
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm font-medium">
                {rejectModal && getActionLabel(rejectModal.action_type)} for {rejectModal?.member_id}
              </p>
              <p className="text-lg font-bold text-destructive">
                ₱{rejectModal && (rejectModal.amount / 100).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Rejection Reason</label>
              <Input
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectModal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing === rejectModal?.id}
            >
              {processing === rejectModal?.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PendingActionsQueue;