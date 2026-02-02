import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePollingRefresh } from "@/hooks/usePollingRefresh";

interface PendingItem {
  id: string;
  type: string;
  amount: number;
  reference_number: string;
  created_at: string;
  approval_status: string;
}

const PendingReviewBanner = () => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchPendingItems = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch pending ledger items for current user
      const { data: ledgerItems } = await supabase
        .from('ledger')
        .select('id, type, amount, reference_number, created_at, approval_status')
        .eq('user_id', user.id)
        .eq('approval_status', 'pending_review')
        .order('created_at', { ascending: false });

      // Fetch pending loan items for current user
      const { data: loanItems } = await supabase
        .from('p2p_loans')
        .select('id, principal_amount, reference_number, created_at, approval_status, status')
        .or(`borrower_id.eq.${user.id},lender_id.eq.${user.id}`)
        .eq('approval_status', 'pending_review')
        .order('created_at', { ascending: false });

      const items: PendingItem[] = [];

      (ledgerItems || []).forEach((item) => {
        items.push({
          id: item.id,
          type: item.type,
          amount: Number(item.amount),
          reference_number: item.reference_number,
          created_at: item.created_at,
          approval_status: item.approval_status,
        });
      });

      (loanItems || []).forEach((item) => {
        items.push({
          id: item.id,
          type: item.status === 'open' ? 'loan_request' : 'loan_funding',
          amount: Number(item.principal_amount),
          reference_number: item.reference_number,
          created_at: item.created_at,
          approval_status: item.approval_status,
        });
      });

      setPendingItems(items);
    } catch (err) {
      console.error('Failed to fetch pending items:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Poll every 10s instead of realtime subscriptions
  usePollingRefresh(fetchPendingItems, {
    interval: 10000,
    enabled: !!user,
    immediate: true,
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'transfer_out': return 'Transfer';
      case 'loan_request': return 'Loan Request';
      case 'loan_funding': return 'Loan Funding';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-success';
      case 'withdrawal': return 'text-destructive';
      case 'transfer_out': return 'text-primary';
      case 'loan_request': return 'text-amber-500';
      case 'loan_funding': return 'text-emerald-500';
      default: return 'text-muted-foreground';
    }
  };

  if (loading || pendingItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card 
        className="p-4 bg-amber-500/10 border-amber-500/30 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-amber-500">
                {pendingItems.length} Transaction{pendingItems.length > 1 ? 's' : ''} Pending Review
              </p>
              <p className="text-xs text-muted-foreground">
                Being verified by the Sovereign Collective
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {expanded ? 'Hide details' : 'Show details'}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-2 overflow-hidden"
            >
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className={`text-sm font-medium ${getTypeColor(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.reference_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold balance-number">
                      ₱{(item.amount / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('en-PH')}
                    </p>
                  </div>
                </div>
              ))}

              <p className="text-xs text-center text-muted-foreground pt-2">
                Your transactions are being reviewed for security. This typically takes a few minutes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default PendingReviewBanner;