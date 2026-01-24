import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FoundingAlphaCard from '@/components/cards/FoundingAlphaCard';

interface FloatingMemberCardProps {
  memberName: string;
  memberId: string;
  isActive?: boolean;
}

export function FloatingMemberCard({ memberName, memberId, isActive = true }: FloatingMemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Mini Card Trigger Button */}
      <motion.div
        className="fixed bottom-24 right-6 z-30"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={() => setIsExpanded(true)}
          className="group relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4AF37]/30 shadow-lg hover:shadow-[#D4AF37]/20 transition-all duration-300"
          variant="ghost"
        >
          <div 
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.1), transparent)',
            }}
          />
          <CreditCard className="w-6 h-6 text-[#D4AF37]" />
          
          {/* Pulse indicator */}
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#D4AF37] animate-pulse" />
        </Button>
      </motion.div>

      {/* Expanded Card Modal */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
            />

            {/* Card Container */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Sovereign Republic Backdrop */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: `
                    radial-gradient(ellipse at center, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                    linear-gradient(180deg, transparent 0%, rgba(10, 10, 10, 0.95) 100%)
                  `,
                }}
              />

              {/* Close Button */}
              <motion.button
                className="absolute top-6 right-6 p-2 rounded-full bg-[#1a1a1a]/80 border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                onClick={() => setIsExpanded(false)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.1 }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Card with Animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <FoundingAlphaCard
                  memberName={memberName}
                  memberId={memberId}
                  isActive={isActive}
                  showQR={true}
                />

                {/* Card Label */}
                <motion.p
                  className="text-center mt-6 text-sm text-[#D4AF37]/60 uppercase tracking-[0.3em]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Your Founding Alpha Membership
                </motion.p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default FloatingMemberCard;
