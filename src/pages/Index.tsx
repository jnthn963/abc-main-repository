import Navbar from "@/components/layout/Navbar";
import MemberPulse from "@/components/dashboard/MemberPulse";
import AlphaMarketplace from "@/components/dashboard/AlphaMarketplace";
import SovereignFeed from "@/components/dashboard/SovereignFeed";
import AlphaConcierge from "@/components/dashboard/AlphaConcierge";

const Index = () => {
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
            <div className="lg:col-span-3">
              <MemberPulse />
            </div>

            {/* Center Column - Alpha Marketplace (40%) */}
            <div className="lg:col-span-5">
              <AlphaMarketplace />
            </div>

            {/* Right Column - Sovereign Feed (30%) */}
            <div className="lg:col-span-4">
              <SovereignFeed />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Concierge */}
      <AlphaConcierge />
    </div>
  );
};

export default Index;
