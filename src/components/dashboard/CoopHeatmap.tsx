/**
 * ABC Co-op Heatmap: Circular Capital Allocation Chart
 * Shows distribution of cooperative capital (Credit, Assets, Liquidity)
 * Deep Charcoal and Gold aesthetic
 */

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const allocationData = [
  { name: 'Credit Facilities', value: 45, color: '#D4AF37' },
  { name: 'Asset Holdings', value: 30, color: '#00FF41' },
  { name: 'Liquidity Reserve', value: 25, color: '#8B7500' },
];

const CoopHeatmap = () => {
  return (
    <Card className="glass-card p-4 border-[#D4AF37]/20 bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#D4AF37]">Co-op Liquidity Index</p>
            <p className="text-[10px] text-muted-foreground">Capital Allocation</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF41] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF41]"></span>
          </span>
          <span className="text-[10px] text-[#00FF41] font-medium">LIVE</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Circular Chart */}
        <div className="w-20 h-20 min-h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={36}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {allocationData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-foreground">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default CoopHeatmap;
