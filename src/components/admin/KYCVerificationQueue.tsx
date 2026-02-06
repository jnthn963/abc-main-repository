/**
 * ABC Master Build: KYC Verification Queue Component
 * Lists pending KYC applications with approve/reject actions
 * Includes Founding Status toggle for patronage eligibility
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, UserCheck, UserX, Loader2, RefreshCw,
  AlertCircle, CheckCircle, Crown, Mail, Phone
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PendingMember {
  id: string;
  member_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  kyc_status: string;
  membership_tier: string;
  created_at: string;
  vault_balance: number;
}

interface KYCAction {
  memberId: string;
  memberName: string;
  action: 'approve' | 'reject';
}

interface TierAction {
  memberId: string;
  memberName: string;
  newTier: 'founding' | 'bronze';
}

const KYCVerificationQueue = () => {
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycAction, setKycAction] = useState<KYCAction | null>(null);
  const [tierAction, setTierAction] = useState<TierAction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchPendingMembers = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, member_id, display_name, email, phone, kyc_status, membership_tier, created_at, vault_balance')
        .eq('kyc_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingMembers(data || []);
    } catch (err) {
      console.error('Failed to fetch pending KYC:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPendingMembers();
    const interval = setInterval(fetchPendingMembers, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchPendingMembers]);

  const handleKYCAction = async () => {
    if (!kycAction) return;
    setProcessing(true);

    try {
      const newStatus = kycAction.action === 'approve' ? 'verified' : 'rejected';
      
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: newStatus })
        .eq('id', kycAction.memberId);

      if (error) throw error;

      // Log audit entry
      await supabase.from('admin_audit_log').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id || '',
        action: `KYC_${kycAction.action.toUpperCase()}`,
        details: {
          member_id: kycAction.memberId,
          member_name: kycAction.memberName,
          rejection_reason: kycAction.action === 'reject' ? rejectionReason : null,
        },
      });

      toast({
        title: kycAction.action === 'approve' ? 'KYC Approved' : 'KYC Rejected',
        description: `${kycAction.memberName}'s verification has been ${kycAction.action === 'approve' ? 'approved' : 'rejected'}.`,
      });

      fetchPendingMembers();
    } catch (err) {
      console.error('KYC action failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to update KYC status',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setKycAction(null);
      setRejectionReason('');
    }
  };

  const handleTierAction = async () => {
    if (!tierAction) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ membership_tier: tierAction.newTier })
        .eq('id', tierAction.memberId);

      if (error) throw error;

      // Log audit entry
      await supabase.from('admin_audit_log').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id || '',
        action: `TIER_UPDATE_${tierAction.newTier.toUpperCase()}`,
        details: {
          member_id: tierAction.memberId,
          member_name: tierAction.memberName,
          new_tier: tierAction.newTier,
        },
      });

      toast({
        title: 'Membership Updated',
        description: `${tierAction.memberName} is now a ${tierAction.newTier === 'founding' ? 'Founding Alpha' : 'Bronze'} member.`,
      });

      fetchPendingMembers();
    } catch (err) {
      console.error('Tier update failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to update membership tier',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setTierAction(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPHP = (centavos: number) => {
    return `₱${Math.floor(centavos / 100).toLocaleString()}`;
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 border-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading verification queue...</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-5 bg-card/50 border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            <h2 className="font-semibold text-foreground">KYC Verification Queue</h2>
            {pendingMembers.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 ml-2">
                {pendingMembers.length} pending
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPendingMembers}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {pendingMembers.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">All KYC applications have been processed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingMembers.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg bg-muted/20 border border-border hover:border-yellow-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-primary">{member.member_id}</span>
                      <span className="font-medium text-foreground">
                        {member.display_name || 'Unnamed'}
                      </span>
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px]">
                        PENDING
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email || 'No email'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {member.phone || 'No phone'}
                      </span>
                      <span>Joined: {formatDate(member.created_at)}</span>
                      <span className="text-success">Balance: {formatPHP(member.vault_balance)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Founding Toggle */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 border border-primary/20">
                      <Crown className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Founding</span>
                      <Switch
                        checked={member.membership_tier === 'founding'}
                        onCheckedChange={(checked) => {
                          setTierAction({
                            memberId: member.id,
                            memberName: member.display_name || member.member_id,
                            newTier: checked ? 'founding' : 'bronze',
                          });
                        }}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    {/* Action Buttons */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setKycAction({
                        memberId: member.id,
                        memberName: member.display_name || member.member_id,
                        action: 'reject',
                      })}
                      className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <UserX className="w-4 h-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setKycAction({
                        memberId: member.id,
                        memberName: member.display_name || member.member_id,
                        action: 'approve',
                      })}
                      className="gap-1 bg-success hover:bg-success/90"
                    >
                      <UserCheck className="w-4 h-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* KYC Confirmation Dialog */}
      <AlertDialog open={!!kycAction} onOpenChange={() => setKycAction(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {kycAction?.action === 'approve' ? (
                <UserCheck className="w-5 h-5 text-success" />
              ) : (
                <UserX className="w-5 h-5 text-destructive" />
              )}
              {kycAction?.action === 'approve' ? 'Approve KYC' : 'Reject KYC'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {kycAction?.action === 'approve' ? (
                <>
                  Confirm verification approval for <strong>{kycAction?.memberName}</strong>.
                  This will enable full platform access.
                </>
              ) : (
                <>
                  <p className="mb-3">
                    Reject verification for <strong>{kycAction?.memberName}</strong>.
                    Please provide a reason:
                  </p>
                  <Textarea
                    placeholder="Reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-muted/20 border-border"
                  />
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKYCAction}
              disabled={processing || (kycAction?.action === 'reject' && !rejectionReason.trim())}
              className={kycAction?.action === 'reject' ? 'bg-destructive hover:bg-destructive/90' : 'bg-success hover:bg-success/90'}
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {kycAction?.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tier Confirmation Dialog */}
      <AlertDialog open={!!tierAction} onOpenChange={() => setTierAction(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Update Membership Tier
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tierAction?.newTier === 'founding' ? (
                <>
                  Grant <strong>Founding Alpha</strong> status to <strong>{tierAction?.memberName}</strong>?
                  <p className="mt-2 text-xs text-success">
                    This enables the 5% Patronage Growth Incentive for referrals.
                  </p>
                </>
              ) : (
                <>
                  Remove Founding Alpha status from <strong>{tierAction?.memberName}</strong>?
                  <p className="mt-2 text-xs text-destructive">
                    This will disable their referral commission eligibility.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTierAction}
              disabled={processing}
              className={tierAction?.newTier === 'founding' ? 'bg-primary hover:bg-primary/90' : 'bg-destructive hover:bg-destructive/90'}
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {tierAction?.newTier === 'founding' ? 'Grant Status' : 'Remove Status'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default KYCVerificationQueue;
