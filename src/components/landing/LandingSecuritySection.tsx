import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Server, CheckCircle2 } from 'lucide-react';

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'Military-grade AES-256 encryption protects all your data in transit and at rest.'
  },
  {
    icon: Shield,
    title: 'Multi-Layer Security',
    description: 'Advanced authentication, biometric verification, and real-time fraud detection.'
  },
  {
    icon: Eye,
    title: 'Privacy First',
    description: 'Your data is yours. Zero third-party sharing. Complete financial sovereignty.'
  },
  {
    icon: Server,
    title: '99.99% Uptime',
    description: 'Enterprise-grade infrastructure with redundant systems and 24/7 monitoring.'
  }
];

const complianceBadges = [
  'Bank Secrecy Act Compliant',
  'Anti-Money Laundering',
  'KYC Verified',
  'Data Protection'
];

export default function LandingSecuritySection() {
  return (
    <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-[#050505] to-[#0a1020]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-[#00FF41]/30 bg-[#00FF41]/5">
            <Shield className="w-4 h-4 text-[#00FF41]" />
            <span className="text-xs text-[#00FF41] uppercase tracking-[0.15em]">
              Security & Compliance
            </span>
          </div>
          
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            <span className="text-white">Your Trust is Our</span>
            <span className="text-[#D4AF37]"> Foundation</span>
          </h2>
          
          <p className="text-gray-400 max-w-2xl mx-auto">
            Built with institutional-grade security protocols to protect your assets and privacy at every level.
          </p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-xl border border-gray-800 bg-[#0a0a0a]/50 hover:border-[#D4AF37]/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                <feature.icon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Compliance Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {complianceBadges.map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700 bg-gray-900/50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#00FF41]" />
              <span className="text-xs text-gray-300 font-medium">{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
