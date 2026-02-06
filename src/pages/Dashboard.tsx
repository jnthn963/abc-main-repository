/**
 * ABC Master Dashboard
 * 
 * STABILITY FIX: Uses stable keys and hasInitialData pattern
 * to prevent re-renders and animation re-triggers.
 * 
 * SOVEREIGN INTEGRITY AESTHETIC: Midnight Obsidian, Gold, Yield Green
 * 
 * MOBILE OPTIMIZATION:
 * - Vertical stack layout on mobile (flex-col)
 * - Sticky header with Member ID
 * - Touch-friendly elements (48px min height)
 */

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMemberData } from '@/hooks/useMemberData';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import AppLayout from '@/components/layout/AppLayout';
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
import FloatingMemberCard from '@/components/dashboard/FloatingMemberCard';
import ComplianceShield from '@/components/dashboard/ComplianceShield';
import AuditTrail from '@/components/dashboard/AuditTrail';
import { SovereignMonolith } from '@/components/transitions/SovereignMonolith';
import { StaggeredContainer, StaggeredItem } from '@/components/transitions/StaggeredContainer';

export default function Dashboard() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { refresh: refreshMemberData, loading: memberLoading } = useMemberData();
  const isMobile = useIsMobile();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTransferHub, setShowTransferHub] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  // STABILITY FIX: Track if initial load is complete
  const hasInitialLoadRef = useRef(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // STABILITY FIX: Once we have profile, mark initial load complete
  useEffect(() => {
    if (profile && !hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      setHasInitialLoad(true);
    }
  }, [profile]);

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

  // STABILITY FIX: Only show monolith on true initial load
  if (!hasInitialLoad && (authLoading || !profile)) {
    return <SovereignMonolith message="INITIALIZING SOVEREIGN TERMINAL..." />;
  }

  // Use greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <AppLayout>
      {/* Connection Status Banner */}
      <ConnectionStatusBanner onReconnect={handleReconnect} />
      
      <Navbar onDepositClick={() => setShowDepositModal(true)} />
      
      {/* Main Dashboard */}
      <main className="pt-20 pb-8 px-4 lg:px-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Header - Sticky on mobile */}
          <div className={`mb-6 ${isMobile ? 'sticky top-16 z-40 bg-[#050505] py-3 -mx-4 px-4 border-b border-[#D4AF37]/10' : ''}`}>
            <StaggeredContainer key="dashboard-header">
              <StaggeredItem>
                <h2 className="text-xl md:text-2xl font-bold mb-1">
                  {getGreeting()}, <span style={{
                    background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 60%, #8B7500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>{profile?.display_name || 'Sovereign Member'}</span>
                </h2>
              </StaggeredItem>
              <StaggeredItem>
                <p className="text-sm text-gray-600">
                  <span className="text-[#D4AF37]/60">Sovereign Command Center</span> • ID: <span className="font-mono text-[#D4AF37]">{profile?.member_id || 'Loading...'}</span>
                </p>
              </StaggeredItem>
            </StaggeredContainer>
          </div>

          {/* Pending Review Banner - Shows when user has pending transactions */}
          <StaggeredContainer key="pending-banner">
            <StaggeredItem>
              <PendingReviewBanner />
            </StaggeredItem>
          </StaggeredContainer>

          {/* MOBILE LAYOUT: Vertical Stack */}
          {isMobile ? (
            <div className="space-y-6">
              {/* Member Pulse - Full width on mobile */}
              <StaggeredContainer key="mobile-pulse">
                <StaggeredItem id="vault-balance">
                  <MemberPulse onTransferClick={() => setShowTransferHub(true)} />
                </StaggeredItem>
              </StaggeredContainer>

              {/* Alpha Marketplace */}
              <StaggeredContainer key="mobile-marketplace">
                <StaggeredItem id="marketplace">
                  <AlphaMarketplace />
                </StaggeredItem>
              </StaggeredContainer>

              {/* Audit Trail */}
              <StaggeredContainer key="mobile-audit">
                <StaggeredItem>
                  <AuditTrail />
                </StaggeredItem>
              </StaggeredContainer>

              {/* Sovereign Feed */}
              <StaggeredContainer key="mobile-feed">
                <StaggeredItem id="news-feed">
                  <SovereignFeed />
                </StaggeredItem>
              </StaggeredContainer>
            </div>
          ) : (
            /* DESKTOP LAYOUT: Three Column Grid */
            <StaggeredContainer className="grid grid-cols-1 lg:grid-cols-12 gap-6" staggerDelay={0.15} key="dashboard-grid">
              {/* Left Column - Member Pulse (25%) */}
              <StaggeredItem className="lg:col-span-3" id="vault-balance">
                <MemberPulse onTransferClick={() => setShowTransferHub(true)} />
              </StaggeredItem>

              {/* Center Column - Alpha Marketplace (35%) */}
              <StaggeredItem className="lg:col-span-4" id="marketplace">
                <AlphaMarketplace />
              </StaggeredItem>

              {/* Right Column - Audit Trail + Sovereign Feed (40%) */}
              <StaggeredItem className="lg:col-span-5 space-y-6" id="news-feed">
                {/* Audit Trail - Ledger Verification */}
                <AuditTrail />
                
                {/* Sovereign Feed */}
                <SovereignFeed />
              </StaggeredItem>
            </StaggeredContainer>
          )}
        </div>
      </main>

      {/* Floating Concierge */}
      <AlphaConcierge />

      {/* Floating Compliance Shield - Hidden on mobile */}
      {!isMobile && <ComplianceShield />}

      {/* Floating 3D Membership Card - Hidden on mobile */}
      {!isMobile && profile && (
        <FloatingMemberCard 
          memberName={profile.display_name || 'Sovereign Member'}
          memberId={profile.member_id || '0000'}
          isActive={profile.kyc_status === 'verified'}
        />
      )}

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
    </AppLayout>
  );
}
