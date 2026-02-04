import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Wallet, TrendingUp, Users, Clock, Lock, ArrowRight, Zap, Award, ChevronDown, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';


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

  const TimeBlock = ({
    value,
    label
  }: {
    value: number;
    label: string;
  }) => (
    <div className="flex flex-col items-center">
      <div className="glass-card px-4 py-3 min-w-[70px] border-[#D4AF37]/30 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
        <span className="text-3xl md:text-4xl font-bold text-[#D4AF37] balance-number">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex gap-3 md:gap-4 justify-center">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-3xl text-[#D4AF37] self-start mt-3">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-3xl text-[#D4AF37] self-start mt-3">:</span>
      <TimeBlock value={timeLeft.minutes} label="Minutes" />
      <span className="text-3xl text-[#D4AF37] self-start mt-3">:</span>
      <TimeBlock value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}

// Import the enhanced Founding Alpha Card
import { FoundingAlphaCard } from '@/components/cards/FoundingAlphaCard';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: 'Sovereign Vault',
      description: 'Earn 0.5% daily interest on your vault balance. Automated compounding at midnight.',
      color: 'text-[#D4AF37]'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'P2P Marketplace',
      description: 'Fund loans and earn 15% monthly yield. 50% collateral backing on all loans.',
      color: 'text-success'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Referral Network',
      description: 'Earn 3% commission on your Level 1 referrals. Build your financial network.',
      color: 'text-[#D4AF37]'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Enterprise Security',
      description: 'Row-level security, encrypted data, and server-side validation on all operations.',
      color: 'text-destructive'
    }
  ];

  const benefits = [
    'Founding Alpha Membership Badge',
    'Priority access to new features',
    'Enhanced referral rates',
    'Exclusive community access',
    'Early adopter recognition',
    'Locked-in interest rates'
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Animated background - Obsidian theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/3 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(212, 175, 55, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(212, 175, 55, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-[#D4AF37]/10 backdrop-blur-xl bg-[#0a0a0a]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8B7500] flex items-center justify-center">
                <span className="text-lg font-bold text-black">α</span>
              </div>
              <span className="text-xl font-bold text-[#D4AF37]">ALPHA BANKERS COOPERATIVE</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-400 hover:text-[#D4AF37]">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-[#D4AF37] to-[#8B7500] hover:from-[#E5C04B] hover:to-[#D4AF37] text-black font-semibold">
                  Join Alpha
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              {/* Founding Alpha Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-8">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-sm font-medium text-[#D4AF37]">BECOME A FOUNDING ALPHA MEMBER</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-xs font-bold text-black">
                  LIMITED
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-white">The Sovereign</span>
                <br />
                <span className="text-[#D4AF37]">Republic of Capital</span>
              </h1>

              <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 mb-8">
                Enter the Elite Digital Cooperative. Command a <span className="text-[#D4AF37] font-semibold">1.0% Daily Synergy</span>, dominate the P2P Marketplace, and reclaim the generational wealth. Built by Filipinos, for Alphas.
              </p>

              {/* Countdown Section */}
              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider">
                  Founding Alpha Window Closes In
                </p>
                <CountdownTimer />
              </div>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-[#D4AF37] to-[#8B7500] hover:from-[#E5C04B] hover:to-[#D4AF37] text-black font-bold text-lg px-8 py-6 shadow-lg shadow-[#D4AF37]/20"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Become a Founding Alpha
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10">
                    Learn More
                    <ChevronDown className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Right: Hero Video or Membership Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center lg:justify-end"
            >
              {/* Membership Card */}
              <FoundingAlphaCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent to-[#0d0d0d]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Alpha Advantage
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built for sophisticated investors who demand more from their financial infrastructure.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300 bg-gradient-to-b from-[#1a1a1a]/50 to-[#0d0d0d]/50"
              >
                <div className={`${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding Alpha Benefits */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/30 mb-6">
                <Clock className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">EXCLUSIVE UNTIL MARCH 31, 2026</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Founding Alpha Benefits
              </h2>
              <p className="text-gray-400 mb-8">
                Early members receive exclusive benefits that will never be offered again.
                Your founding status is permanently recorded in our sovereign ledger.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    </div>
                    <span className="text-gray-300">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass-card p-8 border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a]/80 to-[#0d0d0d]/80"
            >
              <div className="text-center">
                <Award className="w-16 h-16 text-[#D4AF37] mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Founding Alpha Member
                </h3>
                <p className="text-gray-400 mb-8">
                  This exclusive membership tier is only available during the founding period.
                </p>
                <div className="space-y-4 text-left mb-8">
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-400">Vault Interest Rate</span>
                    <span className="text-success font-semibold">0.5% Daily</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-400">Lending Yield</span>
                    <span className="text-success font-semibold">15% Monthly</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-400">Referral Commission</span>
                    <span className="text-success font-semibold">3% Level 1</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Membership Status</span>
                    <span className="text-[#D4AF37] font-semibold">Permanent</span>
                  </div>
                </div>
                <Link to="/register">
                  <Button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#8B7500] hover:from-[#E5C04B] hover:to-[#D4AF37] text-black font-bold" size="lg">
                    Claim Founding Status
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Us / Financial Sovereignty Section */}
      <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-[#0d0d0d] to-[#0a0a0a]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              About Alpha Bankers Cooperative
            </h2>
            <p className="text-xl text-[#D4AF37] mb-8 italic">
              "Hindi na tayo magpapa-alipin sa barya. Tayo ang may-ari ng systema."
            </p>
            <div className="text-gray-400 space-y-4 text-lg leading-relaxed">
              <p>
                Alpha Bankers Cooperative is more than a platform—it is the <span className="text-[#D4AF37]">Republic of Capital</span>. We are a sovereign digital cooperative engineered by High-IQ Filipino architects to return the 48% interest "spread" that traditional banks keep for themselves back to the people.
              </p>
              <p>
                Built with the <span className="text-white font-semibold">Anti-Bankruptcy Protocol</span> (over-collateralization + reserve fund surplus), we combat inflation, corruption, and the systemic exploitation of Filipino savers. This is your financial fortress.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#D4AF37]/10 py-12 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8B7500] flex items-center justify-center">
              <span className="text-sm font-bold text-black">α</span>
            </div>
            <span className="text-lg font-bold text-[#D4AF37]">ALPHA BANKERS COOPERATIVE</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            The Sovereign Ledger for Elite Financial Exchange.
          </p>
          <p className="text-xs text-gray-600">
            © 2026 Alpha Bankers Cooperative. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
