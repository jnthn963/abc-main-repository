import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Globe, ArrowRight } from 'lucide-react';

export default function LandingHero() {
  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/50 via-transparent to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-4xl mx-auto"
      >
        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 md:px-4 py-2 mb-6 md:mb-8 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5"
        >
          <Shield className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-[10px] md:text-xs text-[#D4AF37] uppercase tracking-[0.1em] md:tracking-[0.15em] font-medium">
            ALPHA BANKERS COOPERATIVE
          </span>
        </motion.div>

        {/* Main Headline - Responsive sizing */}
        <h1
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 leading-tight px-2"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#D4AF37',
            textShadow: '0 4px 20px rgba(212, 175, 55, 0.2)'
          }}
        >
          THE ARCHITECTURE OF
          <br />
          <span className="text-white">FINANCIAL SOVEREIGNTY</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm md:text-base lg:text-lg text-gray-400 mb-4 max-w-2xl mx-auto leading-relaxed px-4">
          Cease the dependence on incremental gains.
          <br className="hidden sm:block" />
          <span className="text-[#D4AF37] font-medium">Command the system that drives your wealth.</span>
        </p>

        {/* Trust Indicators - Mobile optimized */}
        <div className="flex items-center justify-center gap-4 md:gap-6 mb-8 md:mb-10 text-xs md:text-sm text-gray-500">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00FF41]" />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00FF41]" />
            <span>Global Access</span>
          </div>
        </div>

        {/* CTA Buttons - Full width on mobile, side by side on larger screens */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto min-h-[52px] bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] font-bold text-sm uppercase tracking-[0.1em] px-6 md:px-8 py-6 shadow-lg shadow-[#D4AF37]/20 transition-all duration-300 hover:shadow-[#D4AF37]/40 group"
            >
              Initialize Ledger
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-h-[52px] border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/50 font-medium text-sm uppercase tracking-[0.1em] px-6 md:px-8 py-6 transition-all duration-300"
            >
              Ledger Access
            </Button>
          </Link>
        </div>

        {/* Stats Bar - Responsive grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12 md:mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-xl mx-auto px-4"
        >
          <div className="text-center">
            <p
              className="text-xl md:text-2xl lg:text-3xl font-bold text-[#D4AF37]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              0.5%
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mt-1">Daily Yield</p>
          </div>
          <div className="text-center border-x border-gray-800">
            <p
              className="text-xl md:text-2xl lg:text-3xl font-bold text-[#00FF41]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              100%
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mt-1">Reserve Ratio</p>
          </div>
          <div className="text-center">
            <p
              className="text-xl md:text-2xl lg:text-3xl font-bold text-white"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              24/7
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mt-1">Access</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border border-[#D4AF37]/30 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-[#D4AF37] rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}