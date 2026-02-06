import { motion } from 'framer-motion';
import { Vault, Users, Network, ShieldCheck, Shield, Zap, CheckCircle } from 'lucide-react';
import ProtocolCard from './ProtocolCard';

const protocols = [
  {
    icon: Vault,
    title: 'Sovereign Vault Protocol',
    description: '0.5% Daily Yield Accrual. Automated compounding executed at 00:00:00 UTC.',
    highlight: null
  },
  {
    icon: Users,
    title: 'P2P Lending Protocol',
    description: '15% Monthly Yield Generation. 50% collateral backing on all capital deployments.',
    highlight: 'AUTO-REPAYMENT'
  },
  {
    icon: Network,
    title: 'Referral Network Protocol',
    description: '3% Commission on Level 1 referrals. Build your sovereign financial network.',
    highlight: null
  },
  {
    icon: ShieldCheck,
    title: 'Security Protocol',
    description: 'Row-level security, encrypted data transmission, server-side validation on all operations.',
    highlight: null
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

export default function LandingProtocols() {
  return (
    <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-[#050505] to-[#0a0810]">
      {/* Background Glow Effects */}
      <div className="absolute right-0 top-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
      <div className="absolute left-0 bottom-1/4 w-64 h-64 bg-[#00FF41]/3 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-6 origin-center"
          />
          <h2 
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            <span className="text-white">System</span>
            <span className="text-[#D4AF37]"> Protocols</span>
          </h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            The sovereign infrastructure powering your financial independence.
          </p>
        </motion.div>

        {/* Protocols Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {protocols.map((protocol, index) => (
            <ProtocolCard 
              key={protocol.title}
              icon={protocol.icon}
              title={protocol.title} 
              description={protocol.description}
              index={index}
              highlight={protocol.highlight}
            />
          ))}
        </motion.div>

        {/* AUTO-REPAYMENT GUARANTEE - Hero Feature */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-12 relative"
        >
          <div className="relative p-6 md:p-8 rounded-2xl border-2 border-[#00FF41]/40 bg-gradient-to-br from-[#00FF41]/10 via-[#0a0a0a] to-[#00FF41]/5 overflow-hidden">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FF41]/20 via-transparent to-[#00FF41]/10 animate-pulse opacity-40" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00FF41]/20 rounded-full blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Icon */}
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#00FF41]/20 border-2 border-[#00FF41]/50 flex items-center justify-center">
                  <Shield className="w-8 h-8 md:w-10 md:h-10 text-[#00FF41]" />
                </div>
                {/* Pulsing ring */}
                <div className="absolute -inset-2 border-2 border-[#00FF41]/30 rounded-2xl animate-ping opacity-20" />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg md:text-xl font-bold text-[#00FF41] uppercase tracking-wider">
                    100% Auto-Repayment Guarantee
                  </h3>
                  <CheckCircle className="w-5 h-5 text-[#00FF41]" />
                </div>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
                  Every peso you lend is <span className="font-bold text-[#00FF41]">fully protected</span> by our Reserve Fund. 
                  If a borrower fails to repay within the 28-day term, your <span className="font-bold text-white">principal + interest</span> is 
                  automatically paid to you. <span className="font-semibold text-[#00FF41]">Zero risk. Guaranteed returns.</span>
                </p>
                
                {/* Trust Badges */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/30">
                    <Shield className="w-3.5 h-3.5 text-[#00FF41]" />
                    <span className="text-[#00FF41] font-medium">28-Day Auto-Settlement</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/30">
                    <Zap className="w-3.5 h-3.5 text-[#00FF41]" />
                    <span className="text-[#00FF41] font-medium">Instant Payouts</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                    <CheckCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-[#D4AF37] font-medium">50% Collateral Backed</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* How It Works Steps - Desktop */}
            <div className="relative hidden md:grid grid-cols-5 gap-2 mt-8 pt-6 border-t border-[#00FF41]/20">
              {[
                { step: 1, label: "Deploy Capital", icon: Vault },
                { step: 2, label: "28-Day Term", icon: Zap },
                { step: 3, label: "Default Detection", icon: ShieldCheck },
                { step: 4, label: "Reserve Activated", icon: Shield },
                { step: 5, label: "Instant Payout", icon: CheckCircle }
              ].map((item, idx) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1, duration: 0.4 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  {idx < 4 && (
                    <div className="absolute top-4 left-1/2 w-full h-[2px] bg-gradient-to-r from-[#00FF41]/40 to-[#00FF41]/20" />
                  )}
                  <div className="relative w-8 h-8 mx-auto mb-2 rounded-full bg-[#00FF41]/20 border border-[#00FF41]/40 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-[#00FF41]" />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
