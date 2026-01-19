import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const liquidityData = [
  { time: "00:00", value: 1200000 },
  { time: "04:00", value: 1180000 },
  { time: "08:00", value: 1250000 },
  { time: "12:00", value: 1320000 },
  { time: "16:00", value: 1280000 },
  { time: "20:00", value: 1350000 },
  { time: "24:00", value: 1420000 },
];

const loanRequests = [
  { id: 1, user: "A***4", amount: 15000, interest: 12.5, duration: 30, status: "open" },
  { id: 2, user: "B***2", amount: 8500, interest: 10.0, duration: 30, status: "open" },
  { id: 3, user: "C***9", amount: 25000, interest: 15.0, duration: 30, status: "open" },
  { id: 4, user: "D***1", amount: 5000, interest: 8.5, duration: 30, status: "open" },
  { id: 5, user: "E***7", amount: 50000, interest: 18.0, duration: 30, status: "open" },
];

const AlphaMarketplace = () => {
  const sentimentValue = 68; // 0-100, higher = more bullish

  return (
    <div className="space-y-4">
      {/* Liquidity Chart */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Co-op Liquidity Index
            </h3>
            <p className="text-xs text-muted-foreground">24h Trading Activity</p>
          </div>
          <div className="text-right">
            <p className="balance-number text-xl text-success">₱1,420,500</p>
            <div className="flex items-center gap-1 text-success text-xs">
              <TrendingUp className="w-3 h-3" />
              +5.2%
            </div>
          </div>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={liquidityData}>
              <defs>
                <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45 93% 47%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(45 93% 47%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
              />
              <YAxis hide domain={['dataMin - 50000', 'dataMax + 50000']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 10%)',
                  border: '1px solid hsl(222 30% 25%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Liquidity']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(45 93% 47%)"
                strokeWidth={2}
                fill="url(#liquidityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Sentiment Meter */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Market Power</span>
          <span className={`text-sm font-bold ${sentimentValue > 50 ? 'text-success' : 'text-destructive'}`}>
            {sentimentValue > 50 ? 'Bullish' : 'Bearish'}
          </span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden sentiment-gradient">
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full border-2 border-background shadow-lg transition-all"
            style={{ left: `calc(${sentimentValue}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-destructive" />
            Bears
          </div>
          <div className="flex items-center gap-1">
            Bulls
            <TrendingUp className="w-3 h-3 text-success" />
          </div>
        </div>
      </Card>

      {/* Order Book */}
      <Card className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Available Loan Requests</h3>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/50">
            <span>Member</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Interest</span>
            <span className="text-right">Action</span>
          </div>
          {/* Rows */}
          {loanRequests.map((loan) => (
            <div 
              key={loan.id} 
              className="grid grid-cols-4 gap-2 items-center py-2 order-row rounded-lg px-2 -mx-2"
            >
              <span className="text-sm font-medium font-mono">{loan.user}</span>
              <span className="text-sm text-right balance-number">
                ₱{loan.amount.toLocaleString()}
              </span>
              <span className="text-sm text-right text-success font-medium">
                {loan.interest}%
              </span>
              <div className="text-right">
                <Button 
                  size="sm" 
                  className="h-7 px-3 bg-success hover:bg-success/80 text-success-foreground text-xs font-semibold glow-green"
                >
                  LEND
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AlphaMarketplace;
