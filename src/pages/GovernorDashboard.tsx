import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, AlertTriangle, Power, Sliders, 
  Users, Activity, TrendingUp, Eye,
  MessageSquare, DollarSign, Clock, ChevronRight, Bell
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import QRGatewayManager from "@/components/admin/QRGatewayManager";
import { updateGatewaySettings, getGatewaySettings } from "@/stores/gatewayStore";

const GovernorDashboard = () => {
  // Economic Levers
  const [vaultRate, setVaultRate] = useState([0.5]);
  const [lendingRate, setLendingRate] = useState([15.0]);
  const [borrowerCost, setBorrowerCost] = useState([18.0]);

  // System Controls
  const [killSwitch, setKillSwitch] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Mock Stats
  const stats = {
    totalMembers: 2847,
    activeLoans: 156,
    totalVaultValue: 12450000,
    reserveFund: 1240500,
    pendingWithdrawals: 340000,
    dailyTransactions: 1248,
  };

  // Live Audit Feed
  const auditFeed = [
    { time: "09:45:12", event: "Member A***4 - Deposit ₱50,000", type: "deposit" },
    { time: "09:44:58", event: "Loan #8842 - Funded by B***2", type: "lend" },
    { time: "09:44:30", event: "Member C***9 - Withdrawal Request ₱25,000", type: "withdraw" },
    { time: "09:43:15", event: "KYC Verification - D***1 Approved", type: "kyc" },
    { time: "09:42:00", event: "Interest Distribution Initiated", type: "system" },
    { time: "09:41:30", event: "Member E***7 - Login from Manila", type: "login" },
    { time: "09:40:15", event: "Loan #8841 - Repayment Received", type: "repay" },
    { time: "09:39:00", event: "System Security Scan - All Clear", type: "system" },
  ];

  const getEventColor = (type: string) => {
    switch (type) {
      case "deposit": return "text-success";
      case "lend": return "text-success";
      case "withdraw": return "text-destructive";
      case "repay": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,4%)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,5%)] border-b border-destructive/30 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Governor Dashboard</h1>
              <p className="text-xs text-muted-foreground">Alpha Banking Cooperative • Admin Control</p>
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

          <div className="grid grid-cols-12 gap-6">
            {/* Economic Levers */}
            <div className="col-span-4">
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

                <button className="w-full mt-6 py-2.5 bg-primary/20 border border-primary/50 rounded-lg text-primary font-medium hover:bg-primary/30 transition-colors">
                  Apply Changes
                </button>
              </Card>
            </div>

            {/* Live Audit Trail */}
            <div className="col-span-5">
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
                  {auditFeed.map((event, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <span className="terminal-text text-muted-foreground shrink-0">
                        [{event.time}]
                      </span>
                      <span className={`terminal-text ${getEventColor(event.type)} flex-1`}>
                        {event.event}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Gateway & CMS */}
            <div className="col-span-3 space-y-4">
              {/* QR Gateway Manager */}
              <QRGatewayManager
                currentQRUrl={getGatewaySettings().qrCodeUrl}
                onQRUpdate={(qrUrl, receiverName, receiverNumber) => {
                  updateGatewaySettings(qrUrl, receiverName, receiverNumber);
                }}
              />

              {/* Quick CMS */}
              <Card className="p-4 bg-card/50 border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Post Announcement</h3>
                </div>
                <textarea
                  placeholder="Write announcement..."
                  className="w-full h-20 p-3 rounded-lg bg-muted/30 border border-border text-sm resize-none focus:outline-none focus:border-primary/50"
                />
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 py-2 text-xs bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                    + Image
                  </button>
                  <button className="flex-1 py-2 text-xs bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                    + Video
                  </button>
                  <button className="flex-1 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                    Publish
                  </button>
                </div>
              </Card>

              {/* Concierge Queue */}
              <Card className="p-4 bg-card/50 border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-success" />
                    <h3 className="font-semibold text-foreground text-sm">Concierge Queue</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                    12 waiting
                  </span>
                </div>
                <div className="space-y-2">
                  {["A***7", "B***3", "C***9"].map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-sm text-foreground">Member {user}</span>
                      <button className="text-xs text-primary hover:underline">Reply</button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GovernorDashboard;
