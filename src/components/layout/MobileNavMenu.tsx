/**
 * Mobile Navigation Menu - Hamburger slide-in drawer
 * Mobile-first design for touch-friendly navigation
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  User, 
  Shield, 
  Settings, 
  Wallet,
  Bell,
  LogOut,
  Home,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { SecureLogout } from '@/components/auth/SecureLogout';

interface MobileNavMenuProps {
  onDepositClick?: () => void;
}

export default function MobileNavMenu({ onDepositClick }: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: User, label: 'Account Settings', href: '/profile' },
    { icon: Shield, label: 'Security Settings', href: '/profile#security' },
    { icon: FileText, label: 'Governance', href: '/governance' },
  ];

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-[#D4AF37]" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Slide-in Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed top-0 right-0 h-full w-[280px] bg-[#050505] border-l border-[#D4AF37]/20 z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#D4AF37]/10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B7500] flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-[#050505]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#D4AF37]">
                    {profile?.display_name || 'Member'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {profile?.member_id || '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-[#D4AF37]" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-4 rounded-xl hover:bg-[#D4AF37]/10 transition-colors min-h-[56px] group"
                >
                  <item.icon className="w-5 h-5 text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-colors" />
                  <span className="text-sm text-foreground group-hover:text-[#D4AF37] transition-colors">
                    {item.label}
                  </span>
                </Link>
              ))}

              {/* Deposit Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onDepositClick?.();
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#00FF41]/10 hover:bg-[#00FF41]/20 transition-colors min-h-[56px] group border border-[#00FF41]/20"
              >
                <Wallet className="w-5 h-5 text-[#00FF41]" />
                <span className="text-sm font-bold text-[#00FF41] uppercase tracking-wider">
                  Initialize Deposit
                </span>
              </button>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[#D4AF37]/10">
              <SecureLogout 
                variant="default" 
                className="w-full justify-start min-h-[56px]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
