import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import abcLogo from '@/assets/abc-logo.png';
import CountdownTimer from './CountdownTimer';
export default function LandingHero() {
  return <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-14">
      <motion.div initial={{
      opacity: 0,
      scale: 0.9
    }} animate={{
      opacity: 1,
      scale: 1
    }} transition={{
      duration: 0.6,
      ease: 'easeOut'
    }} className="text-center">
        {/* Central Logo - The Visual Anchor */}
        <div className="relative mb-8">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 w-40 h-40 md:w-56 md:h-56 mx-auto rounded-full bg-[#D4AF37]/5 blur-3xl" />
          
          {/* Logo Container */}
          <motion.div animate={{
          y: [0, -8, 0],
          rotateY: [0, 5, 0, -5, 0]
        }} transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut'
        }} className="relative w-32 h-32 md:w-44 md:h-44 mx-auto">
            
          </motion.div>
        </div>

        {/* Typography - ABC in Gold Serif */}
        <h1 className="text-5xl md:text-7xl font-bold mb-4" style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#D4AF37',
        textShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
      }}>₳lpha ฿ankers Cooperative</h1>

        {/* Tagline in Yield Green */}
        <p className="text-sm md:text-base uppercase tracking-[0.25em] mb-12" style={{
        color: '#00FF41'
      }}>
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
          <Button size="lg" className="bg-[#00FF41] hover:bg-[#00FF41]/90 text-[#050505] font-bold text-sm uppercase tracking-[0.15em] px-10 py-6 transition-all duration-300">
            Initialize Ledger
          </Button>
        </Link>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 1.5
    }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{
        y: [0, 8, 0]
      }} transition={{
        duration: 2,
        repeat: Infinity
      }} className="w-[1px] h-12 bg-gradient-to-b from-[#D4AF37]/50 to-transparent" />
      </motion.div>
    </section>;
}