import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Quote, Users, TrendingUp, Shield } from 'lucide-react';

const manifestoPoints = [
  {
    icon: TrendingUp,
    title: 'The 48% Problem',
    description: 'Traditional banks keep the interest spread for themselves, leaving depositors with near-zero returns.'
  },
  {
    icon: Users,
    title: 'Cooperative Solution',
    description: 'ABC returns that spread to members through a transparent, community-owned financial ecosystem.'
  },
  {
    icon: Shield,
    title: 'Sovereign Protocol',
    description: 'Built with anti-bankruptcy safeguards: over-collateralization and reserve fund surplus.'
  }
];

export default function LandingManifesto() {
  return (
    <section className="relative z-10 py-24 px-4 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a0810] to-[#050505]" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
      <div className="absolute right-0 top-1/3 w-64 h-64 bg-[#00FF41]/5 rounded-full blur-3xl" />

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
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="relative p-8 md:p-12 rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a]/50 backdrop-blur-sm">
            {/* Decorative Quote Mark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 0.1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute -top-4 -left-2 text-8xl text-[#D4AF37] font-serif"
            >
              "
            </motion.div>
            
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
              Hindi na tayo magpapa-alipin sa barya.
              <br />
              <span className="text-white">Tayo ang may-ari ng systema.</span>
            </motion.blockquote>

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-8"
            />
          </div>
        </motion.div>

        {/* Manifesto Points */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
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
              className="text-center p-6"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.15 }}
                className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4"
              >
                <point.icon className="w-6 h-6 text-[#D4AF37]" />
              </motion.div>
              <h3 className="text-lg font-semibold text-white mb-2">{point.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
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
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] font-bold text-sm uppercase tracking-[0.1em] px-10 py-6 shadow-lg shadow-[#D4AF37]/20 transition-all duration-300 hover:shadow-[#D4AF37]/40 group"
            >
              Join the Movement
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-xs text-gray-600 mt-4">
            Founding Alpha membership closes March 31, 2026
          </p>
        </motion.div>
      </div>
    </section>
  );
}
