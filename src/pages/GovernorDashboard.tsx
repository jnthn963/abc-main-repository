import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  AlertTriangle, Power, Sliders, 
  Users, Activity, TrendingUp, Eye,
  DollarSign, Clock, Loader2, Shield
} from "lucide-react";
import abcLogo from "@/assets/abc-logo.png";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import QRGatewayManager from "@/components/admin/QRGatewayManager";
import HeroVideoManager from "@/components/admin/HeroVideoManager";
import SMTPConfigManager from "@/components/admin/SMTPConfigManager";
import PendingActionsQueue from "@/components/admin/PendingActionsQueue";
import PendingActionsSummary from "@/components/admin/PendingActionsSummary";
import MemberManagement from "@/components/admin/MemberManagement";
import LiquidityIndexChart from "@/components/admin/LiquidityIndexChart";
import CMSManager from "@/components/admin/CMSManager";
import FinancialOverview from "@/components/admin/FinancialOverview";
import GovernorMasterLedger from "@/components/admin/GovernorMasterLedger";
import KYCVerificationQueue from "@/components/admin/KYCVerificationQueue";
import SafetyGuardrails from "@/components/admin/SafetyGuardrails";
import { SecureLogout } from "@/components/auth/SecureLogout";
import { ConnectionStatusBanner, ConnectionIndicator } from "@/components/common/ConnectionStatusBanner";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGovernorRealtime } from "@/hooks/useGovernorRealtime";

interface AuditEvent {
  id?: string;
  time: string;
  event: string;
  type: string;
}

const GovernorDashboard = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const {
    stats,
    settings,
    auditFeed,
    loading,
    error: dataError,
    refresh,
    updateSettings,
    isAuthorized,
  } = useGovernorRealtime();
  
  // Local state for sliders (optimistic updates)
  const [vaultRate, setVaultRate] = useState([settings.vaultRate]);
  const [lendingRate, setLendingRate] = useState([settings.lendingRate]);
  const [borrowerCost, setBorrowerCost] = useState([settings.borrowerCost]);
  const [killSwitch, setKillSwitch] = useState(settings.killSwitch);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode);
  
  // Sync local state with realtime settings
  useEffect(() => {
    setVaultRate([settings.vaultRate]);
    setLendingRate([settings.lendingRate]);
    setBorrowerCost([settings.borrowerCost]);
    setKillSwitch(settings.killSwitch);
    setMaintenanceMode(settings.maintenanceMode);
  }, [settings]);

  const getEventColor = (type: string) => {
    switch (type) {
      case "deposit": return "text-success";
      case "lend": return "text-success";
      case "withdraw": return "text-destructive";
      case "repay": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  // Handle rate changes and save to database
  const handleApplyChanges = async () => {
    const result = await updateSettings({
      vaultRate: vaultRate[0],
      lendingRate: lendingRate[0],
      borrowerCost: borrowerCost[0],
      killSwitch,
      maintenanceMode,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Economic levers updated successfully!",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  // Handle QR update
  const handleQRUpdate = async (qrUrl: string, receiverName: string, receiverNumber: string) => {
    const result = await updateSettings({
      qrUrl,
      receiverName,
      receiverPhone: receiverNumber,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "QR Gateway updated successfully!",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update QR Gateway",
        variant: "destructive",
      });
    }
  };

  // Handle Hero Video update
  const handleHeroVideoUpdate = async (url: string | null, type: 'none' | 'upload' | 'youtube' | 'vimeo') => {
    const result = await updateSettings({
      heroVideoUrl: url,
      heroVideoType: type,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Hero video updated successfully!",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update hero video",
        variant: "destructive",
      });
    }
  };

  // Handle SMTP Config update
  const handleSMTPUpdate = async (config: Partial<{
    smtp_host: string | null;
    smtp_port: number;
    smtp_user: string | null;
    smtp_from_email: string | null;
    smtp_from_name: string | null;
  }>) => {
    const result = await updateSettings({
      smtpHost: config.smtp_host,
      smtpPort: config.smtp_port,
      smtpUser: config.smtp_user,
      smtpFromEmail: config.smtp_from_email,
      smtpFromName: config.smtp_from_name,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "SMTP configuration saved!",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save SMTP configuration",
        variant: "destructive",
      });
    }
  };
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,4%)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/governor/login" replace />;
  }

  // Redirect to dashboard if not authorized (no governor/admin role)
  if (!isAuthorized) {
    toast({
      title: "Access Denied",
      description: "You do not have permission to access the Governor Dashboard.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,4%)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Syncing with Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout isGovernor>
      {/* Connection Status Banner */}
      <ConnectionStatusBanner onReconnect={refresh} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,5%)] border-b border-destructive/30 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <img 
              src={abcLogo} 
              alt="Alpha Bankers Cooperative" 
              className="w-10 h-10 rounded-full object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]"
            />
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-bold text-foreground">Governor Dashboard</h1>
                <p className="text-xs text-muted-foreground">Alpha Bankers Cooperative • Real-Time Sync</p>
              </div>
              <ConnectionIndicator />
            </div>
          </div>

          {/* Emergency Controls */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
              maintenanceMode ? "bg-yellow-500/10 border-yellow-500/50" : "bg-card border-border"
            }`}>
              <span className="text-sm font-medium text-foreground">Maintenance Mode</span>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
                className="data-[state=checked]:bg-yellow-500"
              />
            </div>

            <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
              killSwitch ? "bg-destructive/20 border-destructive glow-red" : "bg-card border-border"
            }`}>
              <Power className={`w-4 h-4 ${killSwitch ? "text-destructive" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium text-foreground">KILL SWITCH</span>
              <Switch
                checked={killSwitch}
                onCheckedChange={setKillSwitch}
                className="data-[state=checked]:bg-destructive"
              />
            </div>

            {/* Secure Logout Button */}
            <SecureLogout variant="governor" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-6">
        <div className="max-w-[1800px] mx-auto">
          {/* Kill Switch Warning */}
          {killSwitch && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">EMERGENCY MODE ACTIVE</p>
                <p className="text-sm text-destructive/80">All withdrawals are frozen. Only deposits allowed.</p>
              </div>
            </motion.div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-6 gap-4 mb-6">
            {[
              { label: "Total Members", value: stats.totalMembers.toLocaleString(), icon: Users, color: "primary" },
              { label: "Active Loans", value: stats.activeLoans.toLocaleString(), icon: TrendingUp, color: "success" },
              { label: "Total Vault", value: `₱${(stats.totalVaultValue / 1000000).toFixed(2)}M`, icon: DollarSign, color: "primary" },
              { label: "Reserve Fund", value: `₱${(stats.reserveFund / 1000).toFixed(0)}K`, icon: Shield, color: "success" },
              { label: "Pending W/D", value: `₱${(stats.pendingWithdrawals / 1000).toFixed(0)}K`, icon: Clock, color: "destructive" },
              { label: "Daily TXNs", value: stats.dailyTransactions.toLocaleString(), icon: Activity, color: "primary" },
            ].map((stat, idx) => (
              <Card key={idx} className="p-4 bg-card/50 border-border">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 text-${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className={`text-xl font-bold balance-number text-${stat.color}`}>{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Financial Overview - 50/50 Pulse */}
          <div className="mb-6">
            <FinancialOverview />
          </div>

          {/* Pending Actions Summary Widget */}
          <div className="mb-6">
            <PendingActionsSummary />
          </div>

          {/* Pending Actions Queue - Full Width */}
          <div className="mb-6">
            <PendingActionsQueue />
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Economic Levers */}
            <div className="col-span-3">
              <Card className="p-5 bg-card/50 border-border">
                <div className="flex items-center gap-2 mb-5">
                  <Sliders className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Economic Levers</h2>
                </div>

                <div className="space-y-6">
                  {/* Vault Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Vault Interest Rate</span>
                      <span className="text-lg font-bold text-success balance-number">{vaultRate[0]}%</span>
                    </div>
                    <Slider
                      value={vaultRate}
                      onValueChange={setVaultRate}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="[&_[role=slider]]:bg-success [&_[role=slider]]:border-success"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Daily compounding interest on vault deposits</p>
                  </div>

                  {/* Lending Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Lending Yield Rate</span>
                      <span className="text-lg font-bold text-primary balance-number">{lendingRate[0]}%</span>
                    </div>
                    <Slider
                      value={lendingRate}
                      onValueChange={setLendingRate}
                      max={30}
                      min={5}
                      step={0.5}
                      className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Monthly interest earned by lenders</p>
                  </div>

                  {/* Borrower Cost */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Borrower Cost Rate</span>
                      <span className="text-lg font-bold text-destructive balance-number">{borrowerCost[0]}%</span>
                    </div>
                    <Slider
                      value={borrowerCost}
                      onValueChange={setBorrowerCost}
                      max={35}
                      min={8}
                      step={0.5}
                      className="[&_[role=slider]]:bg-destructive [&_[role=slider]]:border-destructive"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Monthly interest paid by borrowers</p>
                  </div>
                </div>

                <button 
                  onClick={handleApplyChanges}
                  className="w-full mt-6 py-2.5 bg-primary/20 border border-primary/50 rounded-lg text-primary font-medium hover:bg-primary/30 transition-colors"
                >
                  Apply Changes
                </button>
              </Card>

              {/* Safety Guardrails */}
              <div className="mt-6">
                <SafetyGuardrails />
              </div>
            </div>

            {/* KYC Verification Queue */}
            <div className="col-span-5">
              <KYCVerificationQueue />
              
              {/* QR Gateway Manager */}
              <div className="mt-6">
                <QRGatewayManager 
                  currentQRUrl={settings.qrUrl || ''}
                  onQRUpdate={handleQRUpdate}
                />
              </div>
            </div>

            {/* Live Audit Trail */}
            <div className="col-span-4">
              <Card className="p-5 bg-card/50 border-border h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-success" />
                    <h2 className="font-semibold text-foreground">Live Audit Trail</h2>
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  </div>
                  <span className="text-xs text-muted-foreground">Real-time activity</span>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {auditFeed.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No recent activity
                    </div>
                  ) : (
                    auditFeed.map((event, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <span className="text-xs text-muted-foreground font-mono w-16">{event.time}</span>
                        <span className={`text-sm ${getEventColor(event.type)}`}>{event.event}</span>
                      </motion.div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Governor Master Ledger - Full Width */}
          <div className="mt-6">
            <GovernorMasterLedger />
          </div>

          {/* Member Management - Full Width */}
          <div className="mt-6">
            <MemberManagement />
          </div>

          {/* Media & Integration Settings */}
          <div className="grid grid-cols-12 gap-6 mt-6">
            {/* Hero Video Manager */}
            <div className="col-span-4">
              <HeroVideoManager
                currentVideoUrl={settings.heroVideoUrl}
                currentVideoType={settings.heroVideoType}
                onVideoUpdate={handleHeroVideoUpdate}
              />
            </div>

            {/* SMTP Configuration */}
            <div className="col-span-4">
              <SMTPConfigManager
                initialConfig={{
                  smtp_host: settings.smtpHost,
                  smtp_port: settings.smtpPort,
                  smtp_user: settings.smtpUser,
                  smtp_from_email: settings.smtpFromEmail,
                  smtp_from_name: settings.smtpFromName,
                }}
                onConfigUpdate={handleSMTPUpdate}
              />
            </div>

            {/* Content Management Placeholder */}
            {/* Sovereign Broadcast CMS */}
            <div className="col-span-4">
              <CMSManager />
            </div>
          </div>

          {/* Co-op Liquidity Index - CoinMarketCap Style */}
          <div className="mt-6">
            <LiquidityIndexChart />
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default GovernorDashboard;
