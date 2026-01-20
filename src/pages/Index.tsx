import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import MemberPulse from "@/components/dashboard/MemberPulse";
import AlphaMarketplace from "@/components/dashboard/AlphaMarketplace";
import SovereignFeed from "@/components/dashboard/SovereignFeed";
import AlphaConcierge from "@/components/dashboard/AlphaConcierge";
import AlphaAnnouncement from "@/components/onboarding/AlphaAnnouncement";
import GuidingFingerTutorial from "@/components/onboarding/GuidingFingerTutorial";
import TransferFundsHub from "@/components/dashboard/TransferFundsHub";

const Index = () => {
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTransferHub, setShowTransferHub] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const seen = localStorage.getItem("abc-onboarding-complete");
    if (!seen) {
      // Show announcement first
      setShowAnnouncement(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const handleAnnouncementClose = () => {
    setShowAnnouncement(false);
    // After announcement, start tutorial
    setShowTutorial(true);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setHasSeenOnboarding(true);
    localStorage.setItem("abc-onboarding-complete", "true");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Main Dashboard */}
      <main className="pt-20 pb-8 px-4 lg:px-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">
              Good Morning, <span className="gradient-gold">Alpha Member</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Your sovereign financial dashboard • Last updated: Just now
            </p>
          </div>

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
    </div>
  );
};

export default Index;
