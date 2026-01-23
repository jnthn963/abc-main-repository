import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityHardening } from '@/hooks/useSecurityHardening';
import { useMemberData } from '@/hooks/useMemberData';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import MemberPulse from '@/components/dashboard/MemberPulse';
import AlphaMarketplace from '@/components/dashboard/AlphaMarketplace';
import TransferFundsHub from '@/components/dashboard/TransferFundsHub';
import SovereignFeed from '@/components/dashboard/SovereignFeed';
import AlphaConcierge from '@/components/dashboard/AlphaConcierge';
import AlphaAnnouncement from '@/components/onboarding/AlphaAnnouncement';
import GuidingFingerTutorial from '@/components/onboarding/GuidingFingerTutorial';
import DepositModal from '@/components/deposit/DepositModal';
import PendingReviewBanner from '@/components/dashboard/PendingReviewBanner';
import { ConnectionStatusBanner } from '@/components/common/ConnectionStatusBanner';
import { Loader2, Shield } from 'lucide-react';
export default function Dashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { refresh: refreshMemberData } = useMemberData();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTransferHub, setShowTransferHub] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  // Apply security hardening
  useSecurityHardening();

  // Handle reconnection - refresh all data
  const handleReconnect = () => {
    refreshProfile();
    refreshMemberData();
  };
  // Check onboarding status
  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setShowAnnouncement(true);
    }
  }, [profile]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Connection Status Banner */}
      <ConnectionStatusBanner onReconnect={handleReconnect} />
      
      <Navbar onDepositClick={() => setShowDepositModal(true)} />
      {/* Main Dashboard */}
      <main className="pt-20 pb-8 px-4 lg:px-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">
              Good Morning, <span className="gradient-gold">{profile?.display_name || 'Alpha Member'}</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Your sovereign financial dashboard • Member ID: {profile?.member_id || 'Loading...'}
            </p>
          </div>

          {/* Pending Review Banner - Shows when user has pending transactions */}
          <PendingReviewBanner />

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Member Pulse (30%) */}
            <div className="lg:col-span-3" id="vault-balance">
              <MemberPulse onTransferClick={() => setShowTransferHub(true)} />
            </div>

            {/* Center Column - Alpha Marketplace (40%) */}
            <div className="lg:col-span-5" id="marketplace">
              <AlphaMarketplace />
            </div>

            {/* Right Column - Sovereign Feed (30%) */}
            <div className="lg:col-span-4" id="news-feed">
              <SovereignFeed />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Concierge */}
      <AlphaConcierge />

      {/* Onboarding */}
      {showAnnouncement && (
        <AlphaAnnouncement onClose={handleAnnouncementClose} />
      )}

      {showTutorial && (
        <GuidingFingerTutorial onComplete={handleTutorialComplete} />
      )}

      {/* Transfer Funds Modal */}
      <TransferFundsHub 
        isOpen={showTransferHub} 
        onClose={() => setShowTransferHub(false)} 
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
    </div>
  );
}
