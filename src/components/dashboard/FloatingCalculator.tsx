import { useState, useCallback } from 'react';
import { Calculator, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

/**
 * Floating Sovereign Calculator FAB
 * 
 * A floating action button that expands into the hardware-style
 * compound interest calculator. Uses bottom drawer on mobile
 * and a dialog/popover on desktop.
 */

const DAILY_RATE = 0.005; // 0.5% daily

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('0');
  const [isPressed, setIsPressed] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Multi-period yield calculations
  const calculateYields = useCallback((principal: number) => {
    if (principal <= 0) return { daily: 0, weekly: 0, monthly: 0 };
    
    // Simple interest calculations for clear breakdown
    const daily = Math.floor(principal * DAILY_RATE);
    const weekly = Math.floor(principal * DAILY_RATE * 7);
    
    // Compound interest for 30-day projection: A = P(1 + r)^n - P
    const monthlyCompound = principal * Math.pow(1 + DAILY_RATE, 30);
    const monthly = Math.floor(monthlyCompound - principal);
    
    return { daily, weekly, monthly };
  }, []);

  const handleButtonPress = useCallback((value: string) => {
    setIsPressed(value);
    
    // Subtle haptic feedback via audio
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.03;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.02);
    } catch (e) {
      // Silent fail
    }

    setTimeout(() => setIsPressed(null), 100);

    if (value === 'C') {
      setInput('0');
      return;
    }

    if (value === '.' && input.includes('.')) return;

    if (input === '0' && value !== '.') {
      setInput(value);
    } else if (input.length < 12) {
      setInput(input + value);
    }
  }, [input]);

  const currentAmount = parseFloat(input) || 0;
  const yields = calculateYields(currentAmount);
  const totalAfter30Days = currentAmount + yields.monthly;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.floor(amount));
  };

  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    'C', '0', '.'
  ];

  // The Calculator Content (shared between mobile drawer and desktop dialog)
  const CalculatorContent = () => (
    <div className="relative">
      {/* Hardware outer shell with warm amber glow */}
      <div 
        className="relative rounded-xl p-[2px]"
        style={{
          background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.4), rgba(212, 175, 55, 0.2), rgba(197, 160, 89, 0.4))',
          boxShadow: '0 0 20px rgba(197, 160, 89, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Glassmorphism body */}
        <div 
          className="relative rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(25, 25, 30, 0.98), rgba(15, 15, 18, 0.99))',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Metallic texture */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 1px,
                rgba(255,255,255,0.03) 1px,
                rgba(255,255,255,0.03) 2px
              )`,
            }}
          />

          <div className="relative p-4">
            {/* Header badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse" />
              <span 
                className="text-[10px] font-mono tracking-[0.2em] uppercase"
                style={{ color: 'rgba(197, 160, 89, 0.8)' }}
              >
                Sovereign Yield Calculator
              </span>
            </div>

            {/* Enhanced Multi-Period LCD Display Panel */}
            <div 
              className="rounded-lg p-4 mb-4"
              style={{
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.95), rgba(8, 8, 12, 0.98))',
                boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.9), inset 0 -2px 4px rgba(255, 255, 255, 0.02), 0 0 30px rgba(212, 175, 55, 0.25)',
                border: '1px solid rgba(60, 55, 45, 0.4)',
              }}
            >
              {/* Line 1: Principal Amount */}
              <div className="flex justify-between items-center mb-3">
                <span 
                  className="text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: 'rgba(120, 120, 125, 0.7)' }}
                >
                  Principal
                </span>
                <span 
                  className="font-mono text-xl font-bold tracking-wider"
                  style={{
                    color: '#D4AF37',
                    textShadow: '0 0 15px rgba(212, 175, 55, 0.7), 0 0 30px rgba(212, 175, 55, 0.4)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ₱{formatCurrency(currentAmount)}
                </span>
              </div>

              {/* Divider */}
              <div 
                className="h-px mb-3"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.4), transparent)',
                }}
              />

              {/* Line 2: Daily Yield */}
              <div className="flex justify-between items-center mb-2">
                <span 
                  className="text-[9px] font-mono uppercase tracking-wider"
                  style={{ color: 'rgba(100, 100, 105, 0.6)' }}
                >
                  Daily (0.5%)
                </span>
                <span 
                  className="font-mono text-sm font-semibold"
                  style={{
                    color: '#00FF41',
                    textShadow: '0 0 8px rgba(0, 255, 65, 0.5)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  +₱{formatCurrency(yields.daily)}
                </span>
              </div>

              {/* Line 3: Weekly Yield */}
              <div className="flex justify-between items-center mb-2">
                <span 
                  className="text-[9px] font-mono uppercase tracking-wider"
                  style={{ color: 'rgba(100, 100, 105, 0.6)' }}
                >
                  Weekly (7 Days)
                </span>
                <span 
                  className="font-mono text-sm font-semibold"
                  style={{
                    color: '#00FF41',
                    textShadow: '0 0 8px rgba(0, 255, 65, 0.5)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  +₱{formatCurrency(yields.weekly)}
                </span>
              </div>

              {/* Line 4: Monthly Compound Yield */}
              <div className="flex justify-between items-center mb-3">
                <span 
                  className="text-[9px] font-mono uppercase tracking-wider"
                  style={{ color: 'rgba(100, 100, 105, 0.6)' }}
                >
                  Monthly (30 Days)
                </span>
                <span 
                  className="font-mono text-base font-bold"
                  style={{
                    color: '#00FF41',
                    textShadow: '0 0 12px rgba(0, 255, 65, 0.6)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  +₱{formatCurrency(yields.monthly)}
                </span>
              </div>

              {/* Total After 30 Days */}
              <div 
                className="pt-2 border-t flex justify-between items-center"
                style={{ borderColor: 'rgba(60, 55, 45, 0.3)' }}
              >
                <span 
                  className="text-[9px] font-mono uppercase tracking-wider"
                  style={{ color: 'rgba(140, 135, 120, 0.5)' }}
                >
                  Total Balance
                </span>
                <span 
                  className="font-mono text-sm font-semibold"
                  style={{ 
                    color: 'rgba(212, 175, 55, 0.9)',
                    textShadow: '0 0 8px rgba(212, 175, 55, 0.4)',
                  }}
                >
                  ₱{formatCurrency(totalAfter30Days)}
                </span>
              </div>
            </div>

            {/* Tactile Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {buttons.map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleButtonPress(btn)}
                  className={`
                    relative h-12 rounded-lg font-mono text-base font-semibold
                    transition-all duration-75 select-none active:scale-95
                    ${btn === 'C' ? 'text-red-400' : 'text-gray-200'}
                  `}
                  style={{
                    background: isPressed === btn 
                      ? 'linear-gradient(180deg, rgba(28, 28, 32, 1), rgba(38, 38, 42, 1))'
                      : 'linear-gradient(180deg, rgba(50, 50, 54, 1), rgba(38, 38, 42, 1))',
                    boxShadow: isPressed === btn
                      ? 'inset 0 3px 5px rgba(0, 0, 0, 0.6)'
                      : '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    transform: isPressed === btn ? 'translateY(2px)' : 'translateY(0)',
                    border: '1px solid rgba(60, 60, 65, 0.5)',
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Bottom accent */}
            <div className="flex items-center justify-center mt-4 pt-3 border-t border-gray-800/30">
              <div 
                className="text-[8px] font-mono tracking-wider uppercase"
                style={{ color: 'rgba(90, 90, 95, 0.6)' }}
              >
                0.5% Daily • 100% Collateral Backed • 28-Day Lock
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-50 group transition-all duration-300 hover:scale-105"
        style={{
          right: '1rem',
          bottom: isMobile ? '8rem' : '14rem', // Position above other FABs
        }}
        aria-label="Open Yield Calculator"
      >
        <div 
          className="relative p-3 rounded-full transition-all duration-300"
          style={{
            background: 'linear-gradient(145deg, rgba(35, 35, 40, 0.95), rgba(20, 20, 25, 0.98))',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(197, 160, 89, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(197, 160, 89, 0.3)',
          }}
        >
          <Calculator 
            className="w-6 h-6 transition-colors duration-300" 
            style={{ color: '#D4AF37' }}
          />
          
          {/* Pulse ring */}
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ 
              border: '2px solid #D4AF37',
              animationDuration: '2s',
            }}
          />
        </div>
        
        {/* Tooltip */}
        <div 
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
          style={{
            background: 'rgba(20, 20, 25, 0.95)',
            color: '#D4AF37',
            border: '1px solid rgba(197, 160, 89, 0.3)',
          }}
        >
          Yield Calculator
        </div>
      </button>

      {/* Mobile: Bottom Sheet Drawer */}
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent 
            className="bg-[#0a0a0a] border-t border-[#D4AF37]/20"
            style={{
              maxHeight: '85vh',
            }}
          >
            <DrawerHeader className="flex items-center justify-between pb-2">
              <DrawerTitle className="text-[#D4AF37] font-mono text-sm tracking-wider">
                SOVEREIGN YIELD CALCULATOR
              </DrawerTitle>
              <DrawerClose asChild>
                <button className="p-1 rounded hover:bg-gray-800">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </DrawerClose>
            </DrawerHeader>
            <div className="px-4 pb-8">
              <CalculatorContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Desktop: Dialog */
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent 
            className="sm:max-w-[360px] bg-[#0a0a0a] border border-[#D4AF37]/20 p-0 overflow-hidden"
            style={{
              boxShadow: '0 0 40px rgba(197, 160, 89, 0.15)',
            }}
          >
            <DialogHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
              <DialogTitle className="text-[#D4AF37] font-mono text-xs tracking-wider">
                SOVEREIGN YIELD CALCULATOR
              </DialogTitle>
            </DialogHeader>
            <div className="px-4 pb-4">
              <CalculatorContent />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
