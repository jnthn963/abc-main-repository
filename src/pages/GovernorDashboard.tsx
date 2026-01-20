import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Shield, AlertTriangle, Power, Sliders, 
  Users, Activity, TrendingUp, Eye,
  MessageSquare, DollarSign, Clock, ChevronRight, Bell, LogOut, Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import QRGatewayManager from "@/components/admin/QRGatewayManager";
import AdminGatekeeper, { isAdminAuthenticated, clearAdminSession } from "@/components/auth/AdminGatekeeper";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SystemStats {
  totalMembers: number;
  activeLoans: number;
  totalVaultValue: number;
  reserveFund: number;
  pendingWithdrawals: number;
  dailyTransactions: number;
}

interface AuditEvent {
  time: string;
  event: string;
  type: string;
}

interface GlobalSettings {
  vault_interest_rate: number;
  lending_yield_rate: number;
  borrower_cost_rate: number;
  system_kill_switch: boolean;
  maintenance_mode: boolean;
  qr_gateway_url: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
}

const GovernorDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminAuthenticated());
  const [loading, setLoading] = useState(true);
  
  // Economic Levers
  const [vaultRate, setVaultRate] = useState([0.5]);
  const [lendingRate, setLendingRate] = useState([15.0]);
  const [borrowerCost, setBorrowerCost] = useState([18.0]);

  // System Controls
  const [killSwitch, setKillSwitch] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Gateway settings
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // Stats from database
  const [stats, setStats] = useState<SystemStats>({
    totalMembers: 0,
    activeLoans: 0,
    totalVaultValue: 0,
    reserveFund: 0,
    pendingWithdrawals: 0,
    dailyTransactions: 0,
  });

  // Live Audit Feed from database
  const [auditFeed, setAuditFeed] = useState<AuditEvent[]>([]);

  // Fetch all dashboard data from Supabase
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch global settings
      const { data: settings } = await supabase
        .from('global_settings')
        .select('*')
        .maybeSingle();

      if (settings) {
        setVaultRate([settings.vault_interest_rate || 0.5]);
        setLendingRate([settings.lending_yield_rate || 15.0]);
        setBorrowerCost([settings.borrower_cost_rate || 18.0]);
        setKillSwitch(settings.system_kill_switch || false);
        setMaintenanceMode(settings.maintenance_mode || false);
        setQrUrl(settings.qr_gateway_url);
      }

      // Fetch reserve fund
      const { data: reserve } = await supabase
        .from('reserve_fund')
        .select('total_reserve_balance')
        .maybeSingle();

      // Count total members
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Count active loans and sum values
      const { data: activeLoans } = await supabase
        .from('p2p_loans')
        .select('principal_amount')
        .in('status', ['open', 'funded']);

      // Count pending withdrawals (clearing transactions)
      const { data: pendingTxns } = await supabase
        .from('ledger')
        .select('amount')
        .eq('status', 'clearing')
        .eq('type', 'withdrawal');

      // Count today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: dailyCount } = await supabase
        .from('ledger')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Aggregate vault balance (sum all profiles)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('vault_balance');

      const totalVault = (profiles || []).reduce((sum, p) => sum + Number(p.vault_balance), 0);
      const pendingWdAmount = (pendingTxns || []).reduce((sum, t) => sum + Number(t.amount), 0);
      const totalActiveLoansValue = (activeLoans || []).reduce((sum, l) => sum + Number(l.principal_amount), 0);

      setStats({
        totalMembers: memberCount || 0,
        activeLoans: activeLoans?.length || 0,
        totalVaultValue: totalVault / 100,
        reserveFund: reserve ? Number(reserve.total_reserve_balance) / 100 : 0,
        pendingWithdrawals: pendingWdAmount / 100,
        dailyTransactions: dailyCount || 0,
      });

      // Fetch recent audit log
      const { data: auditData } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (auditData && auditData.length > 0) {
        setAuditFeed(auditData.map(a => ({
          time: new Date(a.created_at).toLocaleTimeString('en-PH', { hour12: false }),
          event: a.action,
          type: 'system',
        })));
      } else {
        // Show recent ledger activity if no audit log
        const { data: recentActivity } = await supabase
          .from('ledger')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        setAuditFeed((recentActivity || []).map(tx => ({
          time: new Date(tx.created_at).toLocaleTimeString('en-PH', { hour12: false }),
          event: `${tx.type.replace(/_/g, ' ').toUpperCase()} - ₱${(Number(tx.amount) / 100).toLocaleString()}`,
          type: tx.type.includes('deposit') ? 'deposit' : tx.type.includes('withdrawal') ? 'withdraw' : 'system',
        })));
      }

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

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
    try {
      const { error } = await supabase
        .from('global_settings')
        .update({
          vault_interest_rate: vaultRate[0],
          lending_yield_rate: lendingRate[0],
          borrower_cost_rate: borrowerCost[0],
          system_kill_switch: killSwitch,
          maintenance_mode: maintenanceMode,
        })
        .eq('id', (await supabase.from('global_settings').select('id').maybeSingle()).data?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Economic levers updated successfully!",
      });
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  // Handle QR update
  const handleQRUpdate = async (qrUrl: string, receiverName: string, receiverNumber: string) => {
    try {
      const { data: settingsData } = await supabase.from('global_settings').select('id').maybeSingle();
      
      const { error } = await supabase
        .from('global_settings')
        .update({
          qr_gateway_url: qrUrl,
          receiver_name: receiverName,
          receiver_phone: receiverNumber,
        })
        .eq('id', settingsData?.id);

      if (error) throw error;

      setQrUrl(qrUrl);
      toast({
        title: "Success",
        description: "QR Gateway updated successfully!",
      });
    } catch (err) {
      console.error('Failed to update QR:', err);
      toast({
        title: "Error",
        description: "Failed to update QR Gateway",
        variant: "destructive",
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
  };

  // Show gatekeeper if not authenticated
  if (!isAuthenticated) {
    return <AdminGatekeeper onAuthenticated={() => setIsAuthenticated(true)} />;
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
              <p className="text-xs text-muted-foreground">Alpha Banking Cooperative • Live Data</p>
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

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-colors"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Logout</span>
            </button>
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

                <button 
                  onClick={handleApplyChanges}
                  className="w-full mt-6 py-2.5 bg-primary/20 border border-primary/50 rounded-lg text-primary font-medium hover:bg-primary/30 transition-colors"
                >
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
                  {auditFeed.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No activity recorded yet
                    </div>
                  ) : (
                    auditFeed.map((event, idx) => (
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
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Gateway & CMS */}
            <div className="col-span-3 space-y-4">
              {/* QR Gateway Manager */}
              <QRGatewayManager
                currentQRUrl={qrUrl || ""}
                onQRUpdate={handleQRUpdate}
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
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center py-4">
                  Real-time member support will be enabled
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GovernorDashboard;
