/**
 * ABC Master Build: Alpha Network Card
 * Referral System for Alpha Founding Members
 * 5% Direct Patronage Reward on first-level downline deposits
 * Midnight Obsidian (#050505), Gold (#D4AF37), Yield Green (#00FF41)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Trophy, Star, CheckCircle, Crown, Gift, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AlphaNetworkCardProps {
  onViewLeaderboard?: () => void;
}

const AlphaNetworkCard = ({ onViewLeaderboard }: AlphaNetworkCardProps) => {
  const { profile } = useAuth();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<Array<{
    display_name: string;
    member_id: string;
    total_referral_earnings: number;
  }>>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Check if user is Founding Alpha (created before March 31, 2026)
  const isFoundingAlpha = profile?.membership_tier === 'founding' || 
    (profile?.created_at && new Date(profile.created_at) < new Date('2026-03-31'));

  // Generate referral link
  const referralCode = profile?.referral_code || '';
  const referralLink = referralCode 
    ? `${window.location.origin}/register?ref=${referralCode}`
    : '';

  // Get referral earnings (stored in centavos, display as pesos)
  const totalEarnings = Math.floor((profile?.total_referral_earnings || 0) / 100);

  const handleCopyLink = async () => {
    if (!referralLink) {
      toast.error("Referral link not available");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#00FF41]" />
          <span>Referral link copied!</span>
        </div>,
        { description: "Share with your network to earn 5% commission" }
      );
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) {
      toast.error("Referral code not available");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#00FF41]" />
          <span>Referral code copied: {referralCode}</span>
        </div>
      );
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  const handleOpenLeaderboard = async () => {
    setShowLeaderboard(true);
    setIsLoadingLeaderboard(true);

    try {
      // Fetch top referrers
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, member_id, total_referral_earnings')
        .gt('total_referral_earnings', 0)
        .order('total_referral_earnings', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // If not a founding member, show locked state
  if (!isFoundingAlpha) {
    return (
      <Card className="glass-card p-4 border-[#D4AF37]/10 bg-gradient-to-b from-[#050505] to-[#0a0a0a] opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]/50" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alpha Network</p>
              <p className="text-[10px] text-[#D4AF37]/50">Founding Members Only</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <Crown className="w-3 h-3" />
            <span>LOCKED</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card p-4 border-[#D4AF37]/30 bg-gradient-to-b from-[#050505] to-[#0a0a0a] relative overflow-hidden">
        {/* Subtle gold shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 via-transparent to-[#D4AF37]/5 pointer-events-none" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8960C] flex items-center justify-center">
                <Users className="w-4 h-4 text-[#050505]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#D4AF37]">Alpha Network</p>
                <p className="text-[10px] text-muted-foreground">Patronage Rewards</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-bold">
                FOUNDING
              </span>
            </div>
          </div>

          {/* Referral Code & Link */}
          <div className="space-y-2 mb-3">
            {/* Referral Code */}
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#D4AF37]/20">
                <p className="text-[9px] text-muted-foreground mb-0.5">Your Code</p>
                <p className="font-mono text-sm text-[#D4AF37] font-bold tracking-wider">
                  {referralCode || '—'}
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyCode}
                      className="h-12 px-3 border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/50"
                    >
                      <Copy className="w-4 h-4 text-[#D4AF37]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Copy referral code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Copy Full Link Button */}
            <Button
              onClick={handleCopyLink}
              className="w-full h-9 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] hover:from-[#B8960C] hover:to-[#8B7500] text-[#050505] font-bold text-xs uppercase tracking-wider"
            >
              <Copy className="w-3 h-3 mr-2" />
              Copy Referral Link
            </Button>
          </div>

          {/* Commission & Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 rounded-lg bg-[#00FF41]/10 border border-[#00FF41]/20">
              <div className="flex items-center gap-1 mb-0.5">
                <Gift className="w-3 h-3 text-[#00FF41]" />
                <p className="text-[9px] text-muted-foreground">Commission Rate</p>
              </div>
              <p className="text-lg font-bold text-[#00FF41]">5%</p>
              <p className="text-[8px] text-[#00FF41]/60">Per Deposit</p>
            </div>
            <div className="p-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <div className="flex items-center gap-1 mb-0.5">
                <Star className="w-3 h-3 text-[#D4AF37]" />
                <p className="text-[9px] text-muted-foreground">Total Earned</p>
              </div>
              <p className="text-lg font-bold text-[#D4AF37]">
                ₱{totalEarnings.toLocaleString()}
              </p>
              <p className="text-[8px] text-[#D4AF37]/60">Lifetime</p>
            </div>
          </div>

          {/* Top Builders Button */}
          <Button
            variant="outline"
            onClick={handleOpenLeaderboard}
            className="w-full h-9 border-[#D4AF37]/20 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/40 text-[#D4AF37]"
          >
            <Trophy className="w-4 h-4 mr-2" />
            <span className="text-xs font-semibold uppercase tracking-wider">Top Builders</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>
      </Card>

      {/* Leaderboard Modal */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="max-w-md bg-[#050505] border-[#D4AF37]/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#D4AF37] font-bold uppercase tracking-[0.1em]">
              <Trophy className="w-5 h-5" />
              Top Network Builders
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {isLoadingLeaderboard ? (
              <div className="py-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-8 h-8 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full mx-auto mb-3"
                />
                <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="py-8 text-center">
                <Trophy className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No referral earnings yet</p>
                <p className="text-xs text-muted-foreground/60">Be the first to build your network!</p>
              </div>
            ) : (
              leaderboardData.map((entry, index) => (
                <motion.div
                  key={entry.member_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    index === 0 
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40' 
                      : index === 1 
                        ? 'bg-gray-500/10 border-gray-500/30'
                        : index === 2
                          ? 'bg-orange-900/10 border-orange-800/30'
                          : 'bg-muted/10 border-border/30'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 
                      ? 'bg-[#D4AF37] text-[#050505]' 
                      : index === 1 
                        ? 'bg-gray-400 text-[#050505]'
                        : index === 2
                          ? 'bg-orange-700 text-white'
                          : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {entry.display_name || 'Alpha Member'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {entry.member_id}
                    </p>
                  </div>

                  {/* Earnings */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#00FF41]">
                      ₱{Math.floor(entry.total_referral_earnings / 100).toLocaleString()}
                    </p>
                    <p className="text-[9px] text-muted-foreground">earned</p>
                  </div>
                </motion.div>
              ))
            )}

            {/* Your Position */}
            {profile && totalEarnings > 0 && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Your Position</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#00FF41]/10 border border-[#00FF41]/30">
                  <div className="w-8 h-8 rounded-full bg-[#00FF41] flex items-center justify-center">
                    <Star className="w-4 h-4 text-[#050505]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {profile.display_name || 'You'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {profile.member_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#00FF41]">
                      ₱{totalEarnings.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-muted-foreground">earned</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AlphaNetworkCard;
