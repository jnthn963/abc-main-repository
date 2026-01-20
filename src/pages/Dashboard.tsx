import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import LiveTicker from '@/components/layout/LiveTicker';
import MemberPulse from '@/components/dashboard/MemberPulse';
import AlphaMarketplace from '@/components/dashboard/AlphaMarketplace';
import TransferFundsHub from '@/components/dashboard/TransferFundsHub';
import PendingTransactions from '@/components/dashboard/PendingTransactions';
import SovereignFeed from '@/components/dashboard/SovereignFeed';
import AlphaConcierge from '@/components/dashboard/AlphaConcierge';
import InterestDisplay from '@/components/interest/InterestDisplay';
import AlphaAnnouncement from '@/components/onboarding/AlphaAnnouncement';
import GuidingFingerTutorial from '@/components/onboarding/GuidingFingerTutorial';
import MyLoansPanel from '@/components/lending/MyLoansPanel';
import { Loader2, Shield } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalVaultDeposits: 0,
    totalActiveLoans: 0,
    activeLoanCount: 0,
    reserveFundBalance: 0,
    vaultInterestRate: 0.5,
    lendingYieldRate: 15,
  });

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setShowAnnouncement(true);
    }
  }, [profile]);

  useEffect(() => {
    // Fetch system stats from global_settings and reserve_fund
    const fetchSystemStats = async () => {
      const [settingsResult, reserveResult, loansResult] = await Promise.all([
        supabase.from('global_settings').select('*').single(),
        supabase.from('reserve_fund').select('*').single(),
        supabase.from('p2p_loans').select('principal_amount').in('status', ['open', 'funded']),
      ]);

      if (settingsResult.data) {
        setSystemStats(prev => ({
          ...prev,
          vaultInterestRate: settingsResult.data.vault_interest_rate,
          lendingYieldRate: settingsResult.data.lending_yield_rate,
        }));
      }

      if (reserveResult.data) {
        setSystemStats(prev => ({
          ...prev,
          reserveFundBalance: reserveResult.data.total_reserve_balance,
        }));
      }

      if (loansResult.data) {
        const totalLoans = loansResult.data.reduce((sum, loan) => sum + (loan.principal_amount || 0), 0);
        setSystemStats(prev => ({
          ...prev,
          totalActiveLoans: totalLoans,
          activeLoanCount: loansResult.data.length,
        }));
      }
    };

    fetchSystemStats();
  }, []);

  const handleAnnouncementClose = () => {
    setShowAnnouncement(false);
    setShowTutorial(true);
  };

  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    
    // Mark onboarding as complete
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      
      refreshProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Shield className="w-16 h-16 text-primary mx-auto animate-pulse" />
            <Loader2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
          <p className="text-muted-foreground terminal-text">
            LOADING ALPHA TERMINAL...
          </p>
        </div>
      </div>
    );
  }

  // Create a member data object for components that need it
  const memberData = profile ? {
    memberId: profile.member_id,
    displayName: profile.display_name || 'Alpha Member',
    vaultBalance: profile.vault_balance,
    frozenBalance: profile.frozen_balance,
    lendingBalance: profile.lending_balance,
    tier: profile.membership_tier,
    kycStatus: profile.kyc_status,
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Announcements */}
      {showAnnouncement && (
        <AlphaAnnouncement onClose={handleAnnouncementClose} />
      )}

      {/* Tutorial */}
      {showTutorial && (
        <GuidingFingerTutorial onComplete={handleTutorialComplete} />
      )}

      {/* Live Ticker */}
      <LiveTicker 
        vaultInterestRate={systemStats.vaultInterestRate}
        lendingYieldRate={systemStats.lendingYieldRate}
        totalActiveLoans={systemStats.totalActiveLoans}
        activeLoanCount={systemStats.activeLoanCount}
      />

      {/* Navigation */}
      <Navbar memberData={memberData} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Member Pulse - Balance Cards */}
            <MemberPulse 
              memberData={memberData}
              systemStats={systemStats}
            />

            {/* Interest Display */}
            <InterestDisplay 
              vaultBalance={profile?.vault_balance || 0}
              interestRate={systemStats.vaultInterestRate}
            />

            {/* Transfer Hub */}
            <TransferFundsHub 
              vaultBalance={profile?.vault_balance || 0}
              userId={user?.id || ''}
              onTransferComplete={refreshProfile}
            />

            {/* My Loans Panel */}
            <MyLoansPanel userId={user?.id || ''} />

            {/* Pending Transactions */}
            <PendingTransactions userId={user?.id || ''} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Alpha Marketplace */}
            <AlphaMarketplace 
              userId={user?.id || ''}
              vaultBalance={profile?.vault_balance || 0}
              onLoanAction={refreshProfile}
            />

            {/* Sovereign Feed */}
            <SovereignFeed />

            {/* Alpha Concierge */}
            <AlphaConcierge />
          </div>
        </div>
      </main>
    </div>
  );
}
