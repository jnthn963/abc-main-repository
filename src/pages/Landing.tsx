import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Wallet, TrendingUp, Users, Clock, Lock, ArrowRight, Zap, Award, ChevronDown } from 'lucide-react';
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
  }) => <div className="flex flex-col items-center">
      <div className="glass-card px-4 py-3 min-w-[70px] glow-gold">
        <span className="text-3xl md:text-4xl font-bold text-primary balance-number">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>;
  return <div className="flex gap-3 md:gap-4 justify-center">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-3xl text-primary self-start mt-3">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-3xl text-primary self-start mt-3">:</span>
      <TimeBlock value={timeLeft.minutes} label="Minutes" />
      <span className="text-3xl text-primary self-start mt-3">:</span>
      <TimeBlock value={timeLeft.seconds} label="Seconds" />
    </div>;
}
export default function Landing() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  const features = [{
    icon: <Wallet className="w-6 h-6" />,
    title: 'Alpha Vault',
    description: 'Earn 0.5% daily interest on your vault balance. Automated compounding at midnight.',
    color: 'text-primary'
  }, {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'P2P Lending Marketplace',
    description: 'Fund loans and earn 15% monthly yield. 50% collateral backing on all loans.',
    color: 'text-success'
  }, {
    icon: <Users className="w-6 h-6" />,
    title: 'Referral Network',
    description: 'Earn 3% commission on your Level 1 referrals. Build your financial network.',
    color: 'text-primary'
  }, {
    icon: <Lock className="w-6 h-6" />,
    title: 'Bank-Grade Security',
    description: 'Row-level security, encrypted data, and server-side validation on all operations.',
    color: 'text-destructive'
  }];
  const benefits = ['Founding Alpha Membership Badge', 'Priority access to new features', 'Enhanced referral rates', 'Exclusive community access', 'Early adopter recognition', 'Locked-in interest rates'];
  return <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/10 rounded-full blur-3xl animate-float" style={{
        animationDelay: '1s'
      }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold gradient-gold">ALPHA BANKING COOPERATIVE    </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="glow-gold">
                  Join Alpha
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            {/* Founding Alpha Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">BECOME ONE OF OUR FOUNDING ALPHA MEMBER   </span>
              <span className="px-2 py-0.5 rounded-full bg-primary text-xs font-bold text-primary-foreground">
                LIMITED TIME
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-foreground">The Elite</span>
              <br />
              <span className="gradient-gold">Digital Cooperative</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Join the sovereign financial network. Earn daily interest, participate in P2P lending,
              and build generational wealth with bank-grade security.
            </p>

            {/* Countdown Section */}
            <div className="mb-12">
              <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider">
                Founding Alpha Window Closes In
              </p>
              <CountdownTimer />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="glow-gold text-lg px-8 py-6">
                  <Zap className="w-5 h-5 mr-2" />
                  Become a Founding Alpha
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Learn More
                  <ChevronDown className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{
          opacity: 0
        }} whileInView={{
          opacity: 1
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Alpha Advantage
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built for sophisticated investors who demand more from their financial infrastructure.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => <motion.div key={feature.title} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="glass-card p-6 hover:border-primary/50 transition-all duration-300">
                <div className={`${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Founding Alpha Benefits */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.6
          }} viewport={{
            once: true
          }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/30 mb-6">
                <Clock className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">EXCLUSIVE UNTIL MARCH 31, 2026</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Founding Alpha Benefits
              </h2>
              <p className="text-muted-foreground mb-8">
                Early members receive exclusive benefits that will never be offered again.
                Your founding status is permanently recorded in our ledger.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => <motion.li key={benefit} initial={{
                opacity: 0,
                x: -20
              }} whileInView={{
                opacity: 1,
                x: 0
              }} transition={{
                duration: 0.4,
                delay: index * 0.1
              }} viewport={{
                once: true
              }} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </motion.li>)}
              </ul>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.6
          }} viewport={{
            once: true
          }} className="glass-card p-8 glow-gold">
              <div className="text-center">
                <Award className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Founding Alpha Member
                </h3>
                <p className="text-muted-foreground mb-8">
                  This exclusive membership tier is only available during the founding period.
                </p>
                <div className="space-y-4 text-left mb-8">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Vault Interest Rate</span>
                    <span className="text-success font-semibold">0.5% Daily</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Lending Yield</span>
                    <span className="text-success font-semibold">15% Monthly</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Referral Commission</span>
                    <span className="text-success font-semibold">3% Level 1</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Membership Status</span>
                    <span className="text-primary font-semibold">Permanent</span>
                  </div>
                </div>
                <Link to="/register">
                  <Button className="w-full glow-gold" size="lg">
                    Claim Founding Status
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold gradient-gold">ALPHA BANKING COOPERATIVE</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            The sovereign digital cooperative for elite financial exchange.
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 Alpha Banking Cooperative. All rights reserved.
          </p>
        </div>
      </footer>
    </div>;
}