import { motion } from 'framer-motion';
import { Vault, Users, Network, ShieldCheck } from 'lucide-react';
import ProtocolCard from './ProtocolCard';

const protocols = [
  {
    icon: Vault,
    title: 'Sovereign Vault Protocol',
    description: '0.5% Daily Yield Accrual. Automated compounding executed at 00:00:00 UTC.'
  },
  {
    icon: Users,
    title: 'P2P Lending Protocol',
    description: '15% Monthly Yield Generation. 50% collateral backing on all capital deployments.'
  },
  {
    icon: Network,
    title: 'Referral Network Protocol',
    description: '3% Commission on Level 1 referrals. Build your sovereign financial network.'
  },
  {
    icon: ShieldCheck,
    title: 'Security Protocol',
    description: 'Row-level security, encrypted data transmission, server-side validation on all operations.'
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
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
