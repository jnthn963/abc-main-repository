/**
 * ABC Auto-Compound Toggle
 * Allows members to switch between Static and Accelerated growth modes
 * Gold and Green aesthetic with visual state indication
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Zap, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CompoundToggle = () => {
  const [isCompounding, setIsCompounding] = useState(false);

  const handleToggle = (checked: boolean) => {
    setIsCompounding(checked);
    if (checked) {
      toast.success('Accelerated Compounding Activated', {
        description: 'Your earnings will now auto-compound for maximum growth.',
        icon: <Sparkles className="w-4 h-4 text-[#00FF41]" />,
      });
    } else {
      toast.info('Static Mode Enabled', {
        description: 'Earnings will be credited without compounding.',
      });
    }
  };

  return (
    <Card className={`glass-card p-4 border transition-all duration-500 ${
      isCompounding 
        ? 'border-[#00FF41]/40 bg-gradient-to-b from-[#00FF41]/5 to-[#050505]' 
        : 'border-[#D4AF37]/20 bg-gradient-to-b from-[#050505] to-[#0a0a0a]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500 ${
            isCompounding 
              ? 'bg-[#00FF41]/20 animate-pulse' 
              : 'bg-[#D4AF37]/20'
          }`}>
            {isCompounding ? (
              <Zap className="w-4 h-4 text-[#00FF41]" />
            ) : (
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">Compound Earnings</p>
              {isCompounding && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00FF41]/20 text-[#00FF41] uppercase tracking-wider animate-pulse">
                  Active
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isCompounding ? 'Accelerated Growth Mode' : 'Static Yield Mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-xs font-mono font-semibold transition-colors ${
              isCompounding ? 'text-[#00FF41]' : 'text-[#D4AF37]'
            }`}>
              {isCompounding ? '+0.75%' : '+0.50%'}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {isCompounding ? 'Accelerated' : 'Base Rate'}
            </p>
          </div>
          <Switch
            checked={isCompounding}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-[#00FF41]"
          />
        </div>
      </div>

      {/* Visual Growth Indicator */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Growth Projection (30 Days)</span>
          <span className={`font-mono font-semibold ${isCompounding ? 'text-[#00FF41]' : 'text-[#D4AF37]'}`}>
            {isCompounding ? '+25.23%' : '+15.00%'}
          </span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              isCompounding ? 'bg-[#00FF41]' : 'bg-[#D4AF37]'
            }`}
            style={{ width: isCompounding ? '85%' : '50%' }}
          />
        </div>
      </div>
    </Card>
  );
};

export default CompoundToggle;
