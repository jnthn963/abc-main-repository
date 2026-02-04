/**
 * Alpha Marketplace Component
 * 
 * STABILITY FIX: Uses hasInitialData pattern to show skeleton only on first load
 */

import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Zap, HandCoins, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemberData } from "@/hooks/useMemberData";
import { useLoans, type P2PLoan } from "@/hooks/useLoans";
import LoanRequestModal from "./LoanRequestModal";
import LenderFundingModal from "@/components/lending/LenderFundingModal";
import type { LoanListing } from "@/components/lending/LenderFundingModal";

const liquidityData = [
  { time: "00:00", value: 1200000 },
  { time: "04:00", value: 1180000 },
  { time: "08:00", value: 1250000 },
  { time: "12:00", value: 1320000 },
  { time: "16:00", value: 1280000 },
  { time: "20:00", value: 1350000 },
  { time: "24:00", value: 1420000 },
];

const AlphaMarketplace = () => {
  const { systemStats, calculateMarketSentiment } = useMemberData();
  const { openLoans, loading, refresh } = useLoans();
  
  const [sentimentValue, setSentimentValue] = useState(50);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanListing | null>(null);
  
  // STABILITY FIX: Track if we've ever received loans data
  const hasInitialDataRef = useRef(false);
  const [hasInitialData, setHasInitialData] = useState(false);

  // Update sentiment when system stats change
  useEffect(() => {
    setSentimentValue(calculateMarketSentiment());
  }, [calculateMarketSentiment]);

  // STABILITY FIX: Once we have data, never show loading again
  useEffect(() => {
    if (!loading && !hasInitialDataRef.current) {
      hasInitialDataRef.current = true;
      setHasInitialData(true);
    }
  }, [loading]);

  const handleLendClick = (loan: LoanListing) => {
    setSelectedLoan(loan);
    setShowFundingModal(true);
  };

  const handleFundingComplete = async () => {
    await refresh();
    setShowFundingModal(false);
    setSelectedLoan(null);
  };

  // Convert P2PLoan to LoanListing format
  const loanListings: LoanListing[] = openLoans.map(loan => ({
    id: loan.id,
    borrowerId: loan.borrowerId,
    borrowerAlias: loan.borrowerAlias,
    principalAmount: loan.principalAmount,
    interestRate: loan.interestRate,
    duration: loan.duration,
    status: loan.status,
    createdAt: loan.createdAt,
    collateralAmount: loan.collateralAmount,
  }));

  // Show initial loading state only
  const showLoading = !hasInitialData && loading;

  return (
    <div className="space-y-4">
      {/* Liquidity Chart - Obsidian Theme */}
      <Card className="glass-card p-4 border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a]/80 to-[#0d0d0d]/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              Co-op Liquidity Index
            </h3>
            <p className="text-xs text-muted-foreground">24h Trading Activity</p>
          </div>
          <div className="text-right">
            <p 
              className="balance-number text-xl"
              style={{
                background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 60%, #8B7500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ₱{((systemStats?.totalVaultDeposits || 0) / 1000000).toFixed(2)}M
            </p>
            <div className="flex items-center gap-1 text-success text-xs">
              <TrendingUp className="w-3 h-3" />
              +5.2%
            </div>
          </div>
        </div>
        <div className="h-40 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={liquidityData}>
              <defs>
                <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
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
                  backgroundColor: '#0d0d0d',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Liquidity']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#D4AF37"
                strokeWidth={2}
                fill="url(#liquidityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Sentiment Meter - Gold Accent Theme */}
      <Card className="glass-card p-4 border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a]/60 to-[#0d0d0d]/60">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-medium text-[#D4AF37]">Market Power</span>
            <p className="text-[10px] text-muted-foreground">
              Loan/Deposit Ratio: {systemStats ? ((systemStats.totalActiveLoans / systemStats.totalVaultDeposits) * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
          <span className={`text-sm font-bold ${sentimentValue > 50 ? 'text-success' : 'text-destructive'}`}>
            {sentimentValue > 50 ? 'Bullish' : 'Bearish'}
          </span>
        </div>
        <div 
          className="relative h-3 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, hsl(0 100% 55%), #D4AF37, hsl(145 100% 45%))',
          }}
        >
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full border-2 border-background shadow-lg transition-all duration-500"
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

      {/* Reserve Fund Guarantee Banner */}
      <Card className="glass-card p-3 bg-success/5 border-success/20">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-success" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-success">Reserve Fund Auto-Repayment</p>
            <p className="text-[10px] text-muted-foreground">
              All loans guaranteed by ₱{(systemStats?.reserveFund || 0).toLocaleString()} reserve
            </p>
          </div>
        </div>
      </Card>

      {/* Request Liquidity Button - Premium Gold CTA */}
      <Card className="glass-card p-4 border-[#D4AF37]/40 bg-gradient-to-b from-[#1a1a1a]/80 to-[#0d0d0d]/80">
        <Button 
          onClick={() => setShowLoanModal(true)}
          className="w-full font-semibold text-black"
          style={{
            background: 'linear-gradient(145deg, #D4AF37, #8B7500)',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
          }}
        >
          <HandCoins className="w-4 h-4 mr-2" />
          Request Liquidity
        </Button>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Max 50% of vault holdings • 6-day aging required
        </p>
      </Card>

      {/* Order Book */}
      <Card className="glass-card p-4 border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a]/60 to-[#0d0d0d]/60">
        <h3 className="text-sm font-semibold mb-3">Open Liquidity Requests</h3>
        {showLoading ? (
          <div className="py-8 text-center">
            <div className="space-y-2">
              <div className="h-8 bg-muted/30 rounded animate-pulse" />
              <div className="h-8 bg-muted/30 rounded animate-pulse" />
              <div className="h-8 bg-muted/30 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/50">
              <span>Member</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Interest</span>
              <span className="text-right">Action</span>
            </div>
            {/* Rows */}
            {loanListings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No liquidity requests available
              </div>
            ) : (
              loanListings.map((loan) => (
                <div 
                  key={loan.id} 
                  className="grid grid-cols-4 gap-2 items-center py-2 order-row rounded-lg px-2 -mx-2"
                >
                  <span className="text-sm font-medium font-mono">{loan.borrowerAlias}</span>
                  <span className="text-sm text-right balance-number">
                    ₱{loan.principalAmount.toLocaleString()}
                  </span>
                  <span className="text-sm text-right text-success font-medium">
                    {loan.interestRate}%
                  </span>
                  <div className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => handleLendClick(loan)}
                      className="h-7 px-3 bg-success hover:bg-success/80 text-success-foreground text-xs font-semibold glow-green"
                    >
                      FUND
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Loan Request Modal */}
      <LoanRequestModal 
        isOpen={showLoanModal} 
        onClose={() => setShowLoanModal(false)} 
      />

      {/* Lender Funding Modal */}
      <LenderFundingModal
        isOpen={showFundingModal}
        onClose={() => {
          setShowFundingModal(false);
          setSelectedLoan(null);
        }}
        loan={selectedLoan}
        onFundingComplete={handleFundingComplete}
      />
    </div>
  );
};

export default AlphaMarketplace;
