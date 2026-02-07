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
    <div className="relative group">
      {/* Hardware outer shell with gold glow */}
      <div 
        className="relative rounded-xl p-[2px] transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.4), rgba(212, 175, 55, 0.2), rgba(197, 160, 89, 0.4))',
          boxShadow: '0 0 20px rgba(197, 160, 89, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Glassmorphism body */}
        <div 
          className="relative rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(25, 25, 30, 0.95), rgba(15, 15, 18, 0.98))',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Subtle metallic texture overlay */}
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

          <div className="relative p-3 md:p-4">
            {/* Header badge */}
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse" />
              <span 
                className="text-[8px] md:text-[9px] font-mono tracking-[0.2em] uppercase"
                style={{ color: 'rgba(197, 160, 89, 0.7)' }}
              >
                Sovereign Yield Protocol
              </span>
            </div>

            {/* LCD Display Panel */}
            <div 
              className="rounded-lg p-2.5 md:p-3 mb-3"
              style={{
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8), rgba(10, 10, 15, 0.9))',
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.8), inset 0 -1px 2px rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(50, 50, 55, 0.5)',
              }}
            >
              {/* Current Input - Large */}
              <div className="text-right mb-1">
                <span 
                  className="font-mono text-lg md:text-xl font-bold tracking-wider"
                  style={{
                    color: '#D4AF37',
                    textShadow: '0 0 10px rgba(212, 175, 55, 0.6), 0 0 20px rgba(212, 175, 55, 0.3)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ₱{formatCurrency(currentAmount)}
                </span>
              </div>

              {/* Divider line */}
              <div 
                className="h-px my-1.5"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.3), transparent)',
                }}
              />

              {/* 30-Day Yield Result */}
              <div className="text-right">
                <div 
                  className="text-[9px] md:text-[10px] font-mono uppercase tracking-wider mb-0.5"
                  style={{ color: 'rgba(150, 150, 150, 0.7)' }}
                >
                  30-Day Sovereign Yield
                </div>
                <span 
                  className="font-mono text-sm md:text-base font-semibold"
                  style={{
                    color: '#00FF41',
                    textShadow: '0 0 8px rgba(0, 255, 65, 0.5)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  +₱{formatCurrency(projectedYield)}
                </span>
              </div>

              {/* Total after 30 days */}
              <div className="text-right mt-1 pt-1 border-t border-gray-800/50">
                <span 
                  className="text-[9px] md:text-[10px] font-mono"
                  style={{ color: 'rgba(150, 150, 150, 0.6)' }}
                >
                  Total: <span style={{ color: 'rgba(212, 175, 55, 0.8)' }}>₱{formatCurrency(totalAfter30Days)}</span>
                </span>
              </div>
            </div>

            {/* Tactile Keypad */}
            <div className="grid grid-cols-3 gap-1.5 md:gap-2">
              {buttons.map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleButtonPress(btn)}
                  className={`
                    relative h-8 md:h-9 rounded-md font-mono text-sm md:text-base font-semibold
                    transition-all duration-75 select-none
                    ${btn === 'C' ? 'text-red-400' : 'text-gray-300'}
                  `}
                  style={{
                    background: isPressed === btn 
                      ? 'linear-gradient(180deg, rgba(30, 30, 35, 1), rgba(40, 40, 45, 1))'
                      : 'linear-gradient(180deg, rgba(45, 45, 50, 1), rgba(35, 35, 40, 1))',
                    boxShadow: isPressed === btn
                      ? 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
                      : '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    transform: isPressed === btn ? 'translateY(1px)' : 'translateY(0)',
                    border: '1px solid rgba(60, 60, 65, 0.5)',
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Bottom accent */}
            <div className="flex items-center justify-center gap-2 mt-2.5 pt-2 border-t border-gray-800/30">
              <div 
                className="text-[7px] md:text-[8px] font-mono tracking-wider uppercase"
                style={{ color: 'rgba(100, 100, 105, 0.6)' }}
              >
                0.5% Daily Compound • 100% Collateral Backed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
