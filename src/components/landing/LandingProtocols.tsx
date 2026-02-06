import { motion } from 'framer-motion';
import ProtocolCard from './ProtocolCard';

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

export default function LandingProtocols() {
  return (
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
  );
}
