import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import abcLogo from '@/assets/abc-logo.png';

// Founding Alpha countdown target: March 31, 2026
const FOUNDING_ALPHA_END = new Date('2026-03-31T23:59:59');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = FOUNDING_ALPHA_END.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(difference / (1000 * 60 * 60) % 24),
          minutes: Math.floor(difference / 1000 / 60 % 60),
          seconds: Math.floor(difference / 1000 % 60)
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="px-3 py-2 min-w-[56px] border border-[#D4AF37]/20 bg-[#0a0a0a]">
        <span className="text-2xl md:text-3xl font-mono font-bold text-[#D4AF37]">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] text-[#D4AF37]/50 mt-2 uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex gap-2 md:gap-3 justify-center">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-2xl text-[#D4AF37]/30 self-start mt-2">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-2xl text-[#D4AF37]/30 self-start mt-2">:</span>
      <TimeBlock value={timeLeft.minutes} label="Min" />
      <span className="text-2xl text-[#D4AF37]/30 self-start mt-2">:</span>
      <TimeBlock value={timeLeft.seconds} label="Sec" />
    </div>
  );
}

// System Protocol Card Component
function ProtocolCard({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="p-6 border border-[#D4AF37]/10 bg-[#050505]/80 backdrop-blur-sm hover:border-[#D4AF37]/30 transition-all duration-300"
    >
      <div className="w-8 h-[2px] bg-[#D4AF37] mb-4" />
      <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-[0.15em] mb-3">
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const protocols = [
    {
      title: 'Sovereign Vault Protocol',
      description: '0.5% Daily Yield Accrual. Automated compounding executed at 00:00:00 UTC.'
    },
    {
      title: 'P2P Lending Protocol',
      description: '15% Monthly Yield Generation. 50% collateral backing on all capital deployments.'
    },
    {
      title: 'Referral Network Protocol',
      description: '3% Commission on Level 1 referrals. Build your sovereign financial network.'
    },
    {
      title: 'Security Protocol',
      description: 'Row-level security, encrypted data transmission, server-side validation on all operations.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] overflow-hidden">
      {/* Pure Midnight Obsidian Background */}
      <div className="fixed inset-0 bg-[#050505]" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4AF37]/10 bg-[#050505]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <img 
                src={abcLogo} 
                alt="ABC" 
                className="w-8 h-8 rounded-full object-contain" 
              />
              <span className="text-sm font-bold text-[#D4AF37] tracking-wider">₳฿C</span>
            </div>

            {/* Right: Navigation Options */}
            <div className="flex items-center gap-6">
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  className="text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-transparent text-xs uppercase tracking-[0.15em] font-medium transition-all duration-300"
                >
                  Ledger Login
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
                <span className="text-[#00FF41]/80 text-xs uppercase tracking-[0.1em]">
                  System Status
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Centered Logo Focus */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          {/* Central Logo - The Visual Anchor */}
          <div className="relative mb-8">
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 w-40 h-40 md:w-56 md:h-56 mx-auto rounded-full bg-[#D4AF37]/5 blur-3xl" />
            
            {/* Logo Container */}
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                rotateY: [0, 5, 0, -5, 0]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="relative w-32 h-32 md:w-44 md:h-44 mx-auto"
            >
              <img 
                src={abcLogo} 
                alt="Alpha Bankers Cooperative" 
                className="w-full h-full rounded-full object-contain drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]"
              />
            </motion.div>
          </div>

          {/* Typography - ABC in Gold Serif */}
          <h1 
            className="text-5xl md:text-7xl font-bold mb-4"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: '#D4AF37',
              textShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
            }}
          >
            ₳฿C
          </h1>

          {/* Tagline in Yield Green */}
          <p 
            className="text-sm md:text-base uppercase tracking-[0.25em] mb-12"
            style={{ color: '#00FF41' }}
          >
            Integrity Outside the System
          </p>

          {/* Countdown Section */}
          <div className="mb-12">
            <p className="text-[10px] text-gray-600 mb-4 uppercase tracking-[0.2em]">
              Founding Alpha Protocol Closes In
            </p>
            <CountdownTimer />
          </div>

          {/* CTA Button - INITIALIZE LEDGER */}
          <Link to="/register">
            <Button 
              size="lg" 
              className="bg-[#00FF41] hover:bg-[#00FF41]/90 text-[#050505] font-bold text-sm uppercase tracking-[0.15em] px-10 py-6 transition-all duration-300"
            >
              Initialize Ledger
            </Button>
          </Link>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-[1px] h-12 bg-gradient-to-b from-[#D4AF37]/50 to-transparent"
          />
        </motion.div>
      </section>

      {/* System Protocols Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-6" />
            <h2 className="text-xl md:text-2xl font-bold text-[#D4AF37] uppercase tracking-[0.2em] mb-4">
              System Protocols
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              The sovereign infrastructure powering your financial independence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protocols.map((protocol) => (
              <ProtocolCard 
                key={protocol.title} 
                title={protocol.title} 
                description={protocol.description} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Vault Holdings Preview Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="border border-[#D4AF37]/10 bg-[#050505]/80 backdrop-blur-sm p-8 md:p-12"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-[2px] bg-[#D4AF37]" />
              <span className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.2em]">
                Dashboard Preview
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-[#D4AF37] uppercase tracking-[0.15em] mb-8">
              Consolidated Vault Holdings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">
                  Vault Balance
                </p>
                <p className="text-2xl font-mono font-bold text-[#D4AF37]">
                  ₱ 0.00
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">
                  Frozen Holdings
                </p>
                <p className="text-2xl font-mono font-bold text-gray-500">
                  ₱ 0.00
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">
                  Active Yield
                </p>
                <p className="text-2xl font-mono font-bold text-[#00FF41]">
                  +0.5%
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-8" />
            <blockquote 
              className="text-lg md:text-xl italic mb-8"
              style={{ 
                color: '#D4AF37',
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}
            >
              "Hindi na tayo magpapa-alipin sa barya. Tayo ang may-ari ng systema."
            </blockquote>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl mx-auto">
              Alpha Bankers Cooperative is a sovereign digital cooperative engineered to return 
              the 48% interest "spread" that traditional banks keep for themselves back to the people.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#D4AF37]/10 py-8 px-4 bg-[#050505]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img 
              src={abcLogo} 
              alt="ABC" 
              className="w-6 h-6 rounded-full object-contain opacity-60" 
            />
            <span className="text-sm font-bold text-[#D4AF37]/60">₳฿C</span>
          </div>
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">
            © 2026 Alpha Bankers Cooperative. Sovereign Ledger Protocol.
          </p>
        </div>
      </footer>
    </div>
  );
}
