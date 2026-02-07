import { useState, useCallback } from 'react';

/**
 * Sovereign Hardware Calculator
 * 
 * A high-end, hardware-style compound interest calculator embedded in the footer.
 * Features tactile button animations, LCD-style display, and glassmorphism design.
 * 
 * Formula: A = P(1 + r)^n
 * Where P = principal, r = 0.005 (0.5% daily), n = 30 days
 */

const DAILY_RATE = 0.005; // 0.5% daily
const COMPOUND_DAYS = 30;

export default function SovereignCalculator() {
  const [input, setInput] = useState('0');
  const [isPressed, setIsPressed] = useState<string | null>(null);

  // Calculate compound interest: A = P(1 + r)^n
  const calculateYield = useCallback((principal: number): number => {
    if (principal <= 0) return 0;
    const finalAmount = principal * Math.pow(1 + DAILY_RATE, COMPOUND_DAYS);
    return Math.floor(finalAmount - principal); // Whole peso mandate
  }, []);

  const handleButtonPress = useCallback((value: string) => {
    setIsPressed(value);
    
    // Subtle haptic feedback via audio (optional - silent if not supported)
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
      // Silent fail - audio not critical
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

  return (
    <div className="relative group w-full max-w-[220px] md:max-w-[200px]">
      {/* Hardware outer shell with warm amber glow */}
      <div 
        className="relative rounded-lg p-[1.5px] transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.35), rgba(212, 175, 55, 0.15), rgba(197, 160, 89, 0.35))',
          boxShadow: '0 0 15px rgba(197, 160, 89, 0.25), inset 0 0 15px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Glassmorphism body - Compact */}
        <div 
          className="relative rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(25, 25, 30, 0.95), rgba(15, 15, 18, 0.98))',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Subtle metallic texture */}
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

          <div className="relative p-2.5 md:p-2">
            {/* Header badge - Compact */}
            <div className="flex items-center justify-center gap-1 mb-1.5">
              <div className="w-1 h-1 rounded-full bg-[#00FF41] animate-pulse" />
              <span 
                className="text-[6px] md:text-[7px] font-mono tracking-[0.15em] uppercase"
                style={{ color: 'rgba(197, 160, 89, 0.7)' }}
              >
                Sovereign Yield
              </span>
            </div>

            {/* LCD Display Panel - Warm Amber Glow */}
            <div 
              className="rounded-md p-2 mb-2"
              style={{
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.85), rgba(10, 10, 15, 0.9))',
                boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.8), inset 0 -1px 2px rgba(255, 255, 255, 0.04), 0 0 12px rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(50, 50, 55, 0.4)',
              }}
            >
              {/* Current Input */}
              <div className="text-right mb-0.5">
                <span 
                  className="font-mono text-base md:text-sm font-bold tracking-wider"
                  style={{
                    color: '#D4AF37',
                    textShadow: '0 0 8px rgba(212, 175, 55, 0.5), 0 0 16px rgba(212, 175, 55, 0.25)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ₱{formatCurrency(currentAmount)}
                </span>
              </div>

              {/* Divider */}
              <div 
                className="h-px my-1"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.25), transparent)',
                }}
              />

              {/* 30-Day Yield */}
              <div className="text-right">
                <div 
                  className="text-[7px] md:text-[8px] font-mono uppercase tracking-wider mb-0.5"
                  style={{ color: 'rgba(140, 140, 140, 0.7)' }}
                >
                  30-Day Yield
                </div>
                <span 
                  className="font-mono text-xs md:text-[11px] font-semibold"
                  style={{
                    color: '#00FF41',
                    textShadow: '0 0 6px rgba(0, 255, 65, 0.4)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  +₱{formatCurrency(projectedYield)}
                </span>
              </div>

              {/* Total */}
              <div className="text-right mt-1 pt-1 border-t border-gray-800/40">
                <span 
                  className="text-[7px] md:text-[8px] font-mono"
                  style={{ color: 'rgba(130, 130, 135, 0.5)' }}
                >
                  Total: <span style={{ color: 'rgba(212, 175, 55, 0.7)' }}>₱{formatCurrency(totalAfter30Days)}</span>
                </span>
              </div>
            </div>

            {/* Tactile Keypad - Compact with larger touch targets */}
            <div className="grid grid-cols-3 gap-1">
              {buttons.map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleButtonPress(btn)}
                  className={`
                    relative h-7 md:h-6 min-h-[28px] rounded font-mono text-xs md:text-[11px] font-semibold
                    transition-all duration-75 select-none active:scale-95
                    ${btn === 'C' ? 'text-red-400' : 'text-gray-300'}
                  `}
                  style={{
                    background: isPressed === btn 
                      ? 'linear-gradient(180deg, rgba(28, 28, 32, 1), rgba(38, 38, 42, 1))'
                      : 'linear-gradient(180deg, rgba(42, 42, 46, 1), rgba(32, 32, 36, 1))',
                    boxShadow: isPressed === btn
                      ? 'inset 0 2px 3px rgba(0, 0, 0, 0.5)'
                      : '0 1px 3px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                    transform: isPressed === btn ? 'translateY(1px)' : 'translateY(0)',
                    border: '1px solid rgba(55, 55, 60, 0.4)',
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Bottom accent - Compact */}
            <div className="flex items-center justify-center mt-1.5 pt-1.5 border-t border-gray-800/25">
              <div 
                className="text-[5px] md:text-[6px] font-mono tracking-wider uppercase"
                style={{ color: 'rgba(90, 90, 95, 0.5)' }}
              >
                0.5% Daily • 100% Backed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
