import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';
import abcLogo from '@/assets/abc-logo.png';

export default function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4AF37]/10 bg-[#050505]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                alt="ABC"
                className="w-8 h-8 rounded-full object-fill" src="/lovable-uploads/0192f040-47a6-4c40-87cc-7cccf5ec361b.png" />


              <span className="text-sm font-bold text-[#D4AF37] tracking-wider">₳฿C</span>
            </Link>

            {/* Right: Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-transparent text-xs uppercase tracking-[0.15em] font-medium transition-all duration-300">

                  Ledger Login
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
                <span className="text-[#00FF41]/80 text-xs uppercase tracking-[0.1em]">
                  System Status
                </span>
              </div>
            </div>

            {/* Right: Mobile Hamburger */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open menu">

              <Menu className="w-6 h-6 text-[#D4AF37]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />

        }
      </AnimatePresence>

      {/* Mobile Slide-in Menu */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="md:hidden fixed top-0 right-0 h-full w-[280px] bg-[#050505] border-l border-[#D4AF37]/20 z-[101] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#D4AF37]/10">
              <span className="text-sm font-bold text-[#D4AF37]">₳฿C Menu</span>
              <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu">

                <X className="w-6 h-6 text-[#D4AF37]" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-3">
              <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-[#D4AF37]/10 transition-colors min-h-[56px] group border border-[#D4AF37]/20">

                <LogIn className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-sm font-medium text-[#D4AF37]">
                  Ledger Login
                </span>
              </Link>

              <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors min-h-[56px] group border border-[#D4AF37]/30">

                <UserPlus className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">
                  Initialize Ledger
                </span>
              </Link>
            </nav>

            {/* Footer - System Status */}
            <div className="p-4 border-t border-[#D4AF37]/10">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
                <span className="text-[#00FF41]/80 text-xs uppercase tracking-[0.1em]">
                  System Online
                </span>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}