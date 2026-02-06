import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Quote, Users, TrendingUp, Shield, Wallet, Clock, CheckCircle, Zap, Award } from 'lucide-react';

const manifestoPoints = [
  {
    icon: TrendingUp,
    title: 'The 48% Problem',
    description: 'Traditional banks keep the interest spread for themselves, leaving depositors with near-zero returns.',
    stat: '0.06%',
    statLabel: 'Avg Bank Rate'
  },
  {
    icon: Users,
    title: 'Cooperative Solution',
    description: 'ABC returns that spread to members through a transparent, community-owned financial ecosystem.',
    stat: '1.0%',
    statLabel: 'Daily Synergy'
  },
  {
    icon: Shield,
    title: 'Sovereign Protocol',
    description: 'Built with anti-bankruptcy safeguards: over-collateralization and reserve fund surplus.',
    stat: '100%',
    statLabel: 'Protected'
  }
];

const guaranteeSteps = [
  { icon: Wallet, label: 'Deploy Capital', description: 'Fund marketplace loans' },
  { icon: Clock, label: '28-Day Term', description: 'Fixed duration cycle' },
  { icon: Shield, label: 'Reserve Guard', description: 'Automatic protection' },
  { icon: CheckCircle, label: 'Guaranteed Return', description: 'Principal + yield' }
];

export default function LandingManifesto() {
  return (
    <section className="relative z-10 py-24 px-4 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a0810] to-[#050505]" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
      <div className="absolute right-0 top-1/3 w-64 h-64 bg-[#00FF41]/5 rounded-full blur-3xl" />
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(212, 175, 55, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
            <Quote className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs text-[#D4AF37] uppercase tracking-[0.15em]">
              The Founding Manifesto
            </span>
          </div>
        </motion.div>

        {/* Quote Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="relative p-8 md:p-12 rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a]/50 backdrop-blur-sm">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-[#D4AF37]/30 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-[#D4AF37]/30 rounded-br-2xl" />
            
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative text-xl md:text-2xl lg:text-3xl italic text-center leading-relaxed"
              style={{
                color: '#D4AF37',
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}
            >
              "Beyond Currency Dependence. Command Your Own Financial Ecosystem."
            </motion.blockquote>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center text-gray-400 text-sm mt-6 max-w-2xl mx-auto"
            >
              Hindi na tayo magpapa-alipin sa barya. Tayo ang may-ari ng systema.
            </motion.p>

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-8"
            />
          </div>
        </motion.div>

        {/* Manifesto Points with Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-3 gap-6 mb-20"
        >
          {manifestoPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.2 + index * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="relative p-6 rounded-xl border border-gray-800/50 bg-[#0a0a0a]/50 backdrop-blur-sm group hover:border-[#D4AF37]/30 transition-all duration-300"
            >
              {/* Stat Badge */}
              <div className="absolute -top-3 right-4">
                <div className="px-3 py-1 rounded-full bg-[#0a0a0a] border border-[#D4AF37]/30">
                  <span className="text-sm font-bold text-[#D4AF37]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {point.stat}
                  </span>
                  <span className="text-[9px] text-gray-500 ml-1 uppercase">{point.statLabel}</span>
                </div>
              </div>

              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.15 }}
                className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 transition-colors"
              >
                <point.icon className="w-5 h-5 text-[#D4AF37]" />
              </motion.div>
              
              <h3 className="text-lg font-semibold text-white mb-2">{point.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Auto-Repayment Guarantee Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-20"
        >
          <div className="relative p-8 md:p-10 rounded-2xl border border-[#00FF41]/20 bg-gradient-to-br from-[#00FF41]/5 via-[#0a0a0a]/50 to-[#050505]">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ 
                    boxShadow: ['0 0 20px rgba(0, 255, 65, 0.3)', '0 0 40px rgba(0, 255, 65, 0.5)', '0 0 20px rgba(0, 255, 65, 0.3)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-14 h-14 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/30 flex items-center justify-center"
                >
                  <Shield className="w-7 h-7 text-[#00FF41]" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-white">100% Auto-Repayment Guarantee</h3>
                  <p className="text-sm text-gray-400">Your capital is protected by the Reserve Fund Protocol</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/30">
                <Zap className="w-4 h-4 text-[#00FF41]" />
                <span className="text-sm font-semibold text-[#00FF41]">Active Protection</span>
              </div>
            </div>

            {/* Guarantee Steps */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {guaranteeSteps.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="relative"
                >
                  {index < guaranteeSteps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-[#00FF41]/30 to-transparent" />
                  )}
                  <div className="text-center p-4 rounded-xl bg-[#050505]/50 border border-gray-800/50 hover:border-[#00FF41]/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/20 flex items-center justify-center mx-auto mb-3">
                      <step.icon className="w-4 h-4 text-[#00FF41]" />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">{step.label}</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-800/50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle className="w-3 h-3 text-[#00FF41]" />
                <span>28-Day Fixed Terms</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-3 h-3 text-[#D4AF37]" />
                <span>50% Collateral Lock</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Award className="w-3 h-3 text-[#00FF41]" />
                <span>₱0 Loss History</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Link to="/register">
            <Button
              size="lg"
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] font-bold text-sm uppercase tracking-[0.1em] px-12 py-7 shadow-lg shadow-[#D4AF37]/20 transition-all duration-300 hover:shadow-[#D4AF37]/40 group"
            >
              Initialize Your Ledger
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs text-gray-500">Founding Alpha Status</span>
            </div>
            <span className="text-gray-700">•</span>
            <span className="text-xs text-gray-600">Closes March 31, 2026</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
