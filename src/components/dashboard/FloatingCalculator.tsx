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
const COMPOUND_DAYS = 30;

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('0');
  const [isPressed, setIsPressed] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Calculate compound interest: A = P(1 + r)^n
  const calculateYield = useCallback((principal: number): number => {
    if (principal <= 0) return 0;
    const finalAmount = principal * Math.pow(1 + DAILY_RATE, COMPOUND_DAYS);
    return Math.floor(finalAmount - principal); // Whole peso mandate
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
  const projectedYield = calculateYield(currentAmount);
  const totalAfter30Days = currentAmount + projectedYield;

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

            {/* LCD Display Panel */}
            <div 
              className="rounded-lg p-4 mb-4"
              style={{
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9), rgba(10, 10, 15, 0.95))',
                boxShadow: 'inset 0 3px 8px rgba(0, 0, 0, 0.8), inset 0 -2px 4px rgba(255, 255, 255, 0.03), 0 0 20px rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(50, 50, 55, 0.5)',
              }}
            >
              {/* Current Input */}
              <div className="text-right mb-2">
                <span 
                  className="font-mono text-2xl font-bold tracking-wider"
                  style={{
                    color: '#D4AF37',
                    textShadow: '0 0 12px rgba(212, 175, 55, 0.6), 0 0 24px rgba(212, 175, 55, 0.3)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ₱{formatCurrency(currentAmount)}
                </span>
              </div>

              {/* Divider */}
              <div 
                className="h-px my-2"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.3), transparent)',
                }}
              />

              {/* 30-Day Yield */}
              <div className="text-right">
                <div 
                  className="text-[9px] font-mono uppercase tracking-wider mb-1"
                  style={{ color: 'rgba(140, 140, 140, 0.8)' }}
                >
                  30-Day Compound Yield
                </div>
                <span 
                  className="font-mono text-lg font-semibold"
                  style={{
                    color: '#00FF41',
                    textShadow: '0 0 8px rgba(0, 255, 65, 0.5)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  +₱{formatCurrency(projectedYield)}
                </span>
              </div>

              {/* Total */}
              <div className="text-right mt-2 pt-2 border-t border-gray-800/50">
                <span 
                  className="text-[10px] font-mono"
                  style={{ color: 'rgba(130, 130, 135, 0.6)' }}
                >
                  Total: <span style={{ color: 'rgba(212, 175, 55, 0.8)' }}>₱{formatCurrency(totalAfter30Days)}</span>
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
