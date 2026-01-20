import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Send, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PendingTransactions from "./PendingTransactions";
import { getMemberData, subscribeMemberStore } from "@/stores/memberStore";

interface MemberPulseProps {
  onTransferClick?: () => void;
}

const MemberPulse = ({ onTransferClick }: MemberPulseProps) => {
  const [memberData, setMemberData] = useState(getMemberData());

  // Subscribe to member data changes
  useEffect(() => {
    const unsubscribe = subscribeMemberStore(() => {
      setMemberData(getMemberData());
    });
    return () => unsubscribe();
  }, []);

  const { vaultBalance, frozenBalance } = memberData;
  const dailyYield = vaultBalance * 0.005;

  // Calculate yield data dynamically
  const yieldData = [
    { day: "Mon", value: vaultBalance * 0.97 },
    { day: "Tue", value: vaultBalance * 0.975 },
    { day: "Wed", value: vaultBalance * 0.98 },
    { day: "Thu", value: vaultBalance * 0.985 },
    { day: "Fri", value: vaultBalance * 0.99 },
    { day: "Sat", value: vaultBalance * 0.995 },
    { day: "Sun", value: vaultBalance },
  ];

  return (
    <div className="space-y-4">
      {/* Vault Balance Card */}
      <Card className="glass-card p-5 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Vault Balance</span>
          </div>
          <div className="flex items-center gap-1 text-success text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            +0.5%
          </div>
        </div>
        <div className="balance-number text-3xl text-success mb-1">
          ₱{vaultBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-muted-foreground">
          Daily Yield: <span className="text-success">+₱{dailyYield.toFixed(2)}</span>
        </p>
      </Card>

      {/* Frozen Balance */}
      <Card className="glass-card p-4 border-destructive/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-destructive/20 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Frozen (Collateral + Clearing)</p>
              <p className="balance-number text-lg text-destructive">
                ₱{frozenBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Pending Transactions with Clearing Timers */}
      <PendingTransactions />

      {/* Yield Graph */}
      <Card className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">7-Day Yield</span>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yieldData}>
              <defs>
                <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145 100% 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(145 100% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
              />
              <YAxis hide domain={['dataMin - 500', 'dataMax + 500']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 10%)',
                  border: '1px solid hsl(222 30% 25%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(210 40% 96%)' }}
                formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Balance']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(145 100% 45%)"
                strokeWidth={2}
                fill="url(#yieldGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3" id="transfer-funds">
        <Card 
          className="glass-card p-4 hover:border-primary/50 cursor-pointer transition-all group"
          onClick={onTransferClick}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium">Transfer Funds</p>
          <p className="text-xs text-muted-foreground">Banks • E-Wallets</p>
        </Card>
        <Card className="glass-card p-4 hover:border-success/50 cursor-pointer transition-all group">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-2 group-hover:bg-success/20 transition-colors">
            <FileText className="w-5 h-5 text-success" />
          </div>
          <p className="text-sm font-medium">My Loans</p>
          <p className="text-xs text-muted-foreground">Active: {memberData.activeLoans.length}</p>
        </Card>
      </div>
    </div>
  );
};

export default MemberPulse;