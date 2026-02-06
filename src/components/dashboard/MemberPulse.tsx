/**
 * ABC Master Build: Triple-Balance Member Pulse
 * E-Wallet (Liquid), Alpha Network (Referrals), Loan Collateral (Locked)
 * Midnight Obsidian (#050505), Gold (#D4AF37), Yield Green (#00FF41)
 * 
 * 2026 INSTITUTIONAL PROTOCOL:
 * - 0.5% Base Vault Yield + 0.5% Lending Synergy = 1.0% Total Daily
 * - 50% Liquidity Rule enforced
 * - Frozen assets continue earning 0.5% base yield
 * - Alpha Network: 5% Patronage Reward for Founding Members
 * 
 * MOBILE OPTIMIZATION:
 * - Vertical stack layout on mobile
 * - Collapsible accordion sections for secondary content
 * - Touch-friendly 48px minimum button heights
 * - Larger centered balance display
 */

import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, Send, FileText, Lock, Radio, Info, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import PendingTransactions from "./PendingTransactions";
import MyLoansPanel from "@/components/lending/MyLoansPanel";
import LendCapitalModal from "@/components/lending/LendCapitalModal";
import InterestDisplay from "@/components/interest/InterestDisplay";
import CoopHeatmap from "./CoopHeatmap";
import CompoundToggle from "./CompoundToggle";
import AlphaNetworkCard from "./AlphaNetworkCard";
import MobileCollapsibleSection from "./MobileCollapsibleSection";
import { useMemberData } from "@/hooks/useMemberData";
import { useLoans } from "@/hooks/useLoans";

interface MemberPulseProps {
  onTransferClick?: () => void;
}

const MemberPulse = ({ onTransferClick }: MemberPulseProps) => {
  const { memberData, systemStats, loading } = useMemberData();
  const { myLoansAsBorrower } = useLoans();
  const isMobile = useIsMobile();
  const [showLoansPanel, setShowLoansPanel] = useState(false);
  const [showLendModal, setShowLendModal] = useState(false);
  
  // STABILITY FIX: Track if we've ever received data
  const hasInitialDataRef = useRef(false);
  const [hasInitialData, setHasInitialData] = useState(false);

  // Count active funded loans
  const activeLoansCount = myLoansAsBorrower.filter(l => l.status === 'funded').length;

  // STABILITY FIX: Once we have data, never show skeleton again
  useEffect(() => {
    if (memberData && !hasInitialDataRef.current) {
      hasInitialDataRef.current = true;
      setHasInitialData(true);
    }
  }, [memberData]);

  // Only show skeleton on true initial load
  if (!hasInitialData && (loading || !memberData)) {
    return (
      <div className="space-y-4">
        <Card className="glass-card p-5 border-[#D4AF37]/20 animate-pulse bg-[#050505]">
          <div className="h-20 bg-muted/30 rounded" />
        </Card>
        <Card className="glass-card p-4 border-[#00FF41]/20 animate-pulse bg-[#050505]">
          <div className="h-12 bg-muted/30 rounded" />
        </Card>
        <Card className="glass-card p-4 border-destructive/20 animate-pulse bg-[#050505]">
          <div className="h-12 bg-muted/30 rounded" />
        </Card>
      </div>
    );
  }

  // Use cached data during refresh (show stale data rather than skeleton)
  const data = memberData || { vaultBalance: 0, frozenBalance: 0, lendingBalance: 0 };
  const { vaultBalance, frozenBalance, lendingBalance } = data;
  
  // Calculate total vault for global yield display
  const totalVaultBalance = vaultBalance + frozenBalance + lendingBalance;

  // MOBILE VIEW: Optimized layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* HERO: Consolidated Balance - Larger, centered for mobile */}
        <Card className="glass-card p-6 border-[#D4AF37]/40 bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-[#050505] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none" />
          
          <div className="relative text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Consolidated Vault Holdings
              </p>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF41] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF41]"></span>
                </span>
                <span className="text-[9px] text-[#00FF41] font-bold uppercase tracking-wider">LIVE</span>
              </div>
            </div>
            
            <div 
              className="font-mono text-4xl font-bold tracking-tight mb-3"
              style={{
                background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 40%, #B8960C 70%, #8B7500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(212, 175, 55, 0.3)',
              }}
            >
              ₱{totalVaultBalance.toLocaleString('en-PH')}
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#00FF41] animate-pulse" />
              <span className="text-xs font-semibold text-[#00FF41]">0.5% Daily Accrual Active</span>
            </div>

            {/* Quick Actions - Side by side for mobile */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button
                onClick={onTransferClick}
                className="min-h-[52px] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37]"
                variant="outline"
              >
                <Send className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
              <Button
                onClick={() => setShowLoansPanel(true)}
                className="min-h-[52px] bg-[#00FF41]/10 hover:bg-[#00FF41]/20 border border-[#00FF41]/30 text-[#00FF41]"
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ledger
              </Button>
            </div>
          </div>
        </Card>

        {/* Balance Breakdown - Collapsible */}
        <MobileCollapsibleSection
          title="Balance Details"
          subtitle="Liquid, Frozen & Deployed"
          icon={<Wallet className="w-4 h-4 text-[#D4AF37]" />}
          headerValue={`₱${vaultBalance.toLocaleString()}`}
          headerSubtext="Liquid"
          accentColor="#D4AF37"
          defaultOpen={false}
        >
          <div className="space-y-3">
            {/* Liquid Vault */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-muted-foreground">Liquid Vault</span>
              </div>
              <span className="font-mono text-lg font-bold text-[#D4AF37]">
                ₱{vaultBalance.toLocaleString()}
              </span>
            </div>

            {/* Frozen Collateral */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                <span className="text-sm text-muted-foreground">Loan Collateral</span>
              </div>
              <span className="font-mono text-lg font-bold text-red-400">
                ₱{frozenBalance.toLocaleString()}
              </span>
            </div>

            {/* Lending Balance */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#00FF41]/10 border border-[#00FF41]/20">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-[#00FF41]" />
                <span className="text-sm text-muted-foreground">Deployed Capital</span>
              </div>
              <span className="font-mono text-lg font-bold text-[#00FF41]">
                ₱{lendingBalance.toLocaleString()}
              </span>
            </div>

            <p className="text-[10px] text-center text-muted-foreground pt-2 border-t border-white/5">
              All funds earn 0.5% daily base yield
            </p>
          </div>
        </MobileCollapsibleSection>

        {/* Alpha Network - Collapsible */}
        <AlphaNetworkCard />

        {/* Co-op Heatmap - Collapsible */}
        <CoopHeatmap />

        {/* Compound Toggle */}
        <CompoundToggle />

        {/* Pending Transactions */}
        <PendingTransactions />

        {/* Interest Display */}
        <InterestDisplay />

        {/* My Loans Panel */}
        <MyLoansPanel 
          isOpen={showLoansPanel} 
          onClose={() => setShowLoansPanel(false)} 
        />

        {/* Lend Capital Modal */}
        <LendCapitalModal
          isOpen={showLendModal}
          onClose={() => setShowLendModal(false)}
        />
      </div>
    );
  }

  // DESKTOP VIEW: Original layout
  return (
    <div className="space-y-4">
      {/* HERO STAT: Consolidated Vault Holdings - Enhanced Gold Gradient */}
      <Card className="glass-card p-5 border-[#D4AF37]/40 bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-[#050505] relative overflow-hidden">
        {/* Subtle gold glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Consolidated Vault Holdings</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-muted-foreground/50 hover:text-[#D4AF37] transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-[#0a0a0a] border-[#D4AF37]/30">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37] mt-0.5" />
                      <div>
                        <p className="font-bold text-[#D4AF37] text-xs mb-1">Collateral-Backed Sovereignty</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Your total holdings earn 0.5% daily—including Deployed Capital and Loan Collateral. 
                          The 50% Liquidity Rule ensures system stability while maximizing your yield.
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF41] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF41]"></span>
              </span>
              <span className="text-[9px] text-[#00FF41] font-bold uppercase tracking-wider">LIVE</span>
            </div>
          </div>
          
          <div 
            className="font-mono text-4xl font-bold tracking-tight mb-2"
            style={{
              background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 40%, #B8960C 70%, #8B7500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(212, 175, 55, 0.3)',
            }}
          >
            ₱{totalVaultBalance.toLocaleString('en-PH')}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Radio className="w-3.5 h-3.5 text-[#00FF41] animate-pulse" />
              </div>
              <span className="text-xs font-semibold text-[#00FF41]">0.5% Daily Accrual</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-medium">ACTIVE</span>
          </div>
          
          {/* Frozen/Collateralized Status - 50% Liquidity Rule */}
          {(frozenBalance > 0 || lendingBalance > 0) && (
            <div className="mt-3 pt-3 border-t border-[#D4AF37]/10">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Collateralized/Deployed</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="font-mono text-[#D4AF37]/80 hover:text-[#D4AF37] transition-colors cursor-help">
                        ₱{(frozenBalance + lendingBalance).toLocaleString('en-PH')} locked
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[#0a0a0a] border-[#D4AF37]/30">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                          <span className="font-bold text-[#D4AF37] text-xs">Collateral-Backed Sovereignty</span>
                        </div>
                        <div className="space-y-1 text-[10px] text-muted-foreground">
                          <p>• <span className="text-[#00FF41]">₱{lendingBalance.toLocaleString()}</span> in Deployed Capital (+0.5%/day synergy)</p>
                          <p>• <span className="text-destructive">₱{frozenBalance.toLocaleString()}</span> as Loan Collateral</p>
                          <p className="pt-1 border-t border-border/30 text-[9px]">
                            These funds are non-withdrawable but continue earning 0.5% daily base yield. 
                            Total Daily Synergy: 1.0% (0.5% Base + 0.5% Lending).
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-muted-foreground/60">
                <ShieldCheck className="w-3 h-3" />
                <span>50% Liquidity Reserve maintained</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* E-WALLET (Liquid) - Gold Theme */}
      <Card className="glass-card p-5 border-[#D4AF37]/30 bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <span className="text-sm text-muted-foreground">Liquid Vault</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37]">ACTIVE</span>
          </div>
          <div className="flex items-center gap-1 text-[#00FF41] text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>0.5% Daily Accrual Active</span>
          </div>
        </div>
        <div 
          className="font-mono text-3xl font-semibold tracking-tight mb-1"
          style={{
            background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 60%, #8B7500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ₱{vaultBalance.toLocaleString('en-PH')}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Available for deployment & transfers
        </p>
      </Card>

      {/* ALPHA NETWORK CARD - Replaces Deployed Capital */}
      <AlphaNetworkCard />

      {/* LOAN COLLATERAL (Locked) - Destructive Theme */}
      <Card className="glass-card p-4 border-destructive/20 bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-destructive/20 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Loan Collateral</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                  <Lock className="w-2 h-2" />
                  LOCKED
                </span>
              </div>
              <p className="balance-number text-lg text-destructive">
                ₱{frozenBalance.toLocaleString('en-PH')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">28-Day Lock</p>
          </div>
        </div>
      </Card>

      {/* Co-op Heatmap - Capital Allocation Chart */}
      <CoopHeatmap />

      {/* Auto-Compound Toggle */}
      <CompoundToggle />

      {/* Pending Transactions with Clearing Timers */}
      <PendingTransactions />

      {/* Daily Interest Display */}
      <InterestDisplay />

      {/* Quick Actions - Gold Accent Theme */}
      <div className="grid grid-cols-2 gap-3" id="transfer-funds">
        <Card 
          className="glass-card p-4 border-[#D4AF37]/20 hover:border-[#D4AF37]/50 cursor-pointer transition-all group bg-[#050505]"
          onClick={onTransferClick}
        >
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mb-2 group-hover:bg-[#D4AF37]/20 transition-colors">
            <Send className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <p className="text-sm font-medium text-[#D4AF37]">Release Funds</p>
          <p className="text-xs text-muted-foreground">Banks • E-Wallets • Crypto</p>
        </Card>
        <Card
          className="glass-card p-4 border-[#00FF41]/20 hover:border-[#00FF41]/50 cursor-pointer transition-all group bg-[#050505]"
          onClick={() => setShowLoansPanel(true)}
        >
          <div className="w-10 h-10 rounded-lg bg-[#00FF41]/10 flex items-center justify-center mb-2 group-hover:bg-[#00FF41]/20 transition-colors">
            <FileText className="w-5 h-5 text-[#00FF41]" />
          </div>
          <p className="text-sm font-medium text-[#00FF41]">Sovereign Ledger</p>
          <p className="text-xs text-muted-foreground">
            Active Positions: {activeLoansCount}
          </p>
        </Card>
      </div>

      {/* My Loans Panel */}
      <MyLoansPanel 
        isOpen={showLoansPanel} 
        onClose={() => setShowLoansPanel(false)} 
      />

      {/* Lend Capital Modal */}
      <LendCapitalModal
        isOpen={showLendModal}
        onClose={() => setShowLendModal(false)}
      />
    </div>
  );
};

export default MemberPulse;
