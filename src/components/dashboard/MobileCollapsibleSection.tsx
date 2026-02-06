/**
 * Mobile Collapsible Section - Accordion pattern for mobile dashboard
 * Shows header with key metric, expands to show full details
 * Touch-friendly with 48px minimum touch targets
 */

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MobileCollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  headerValue?: string;
  headerSubtext?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  accentColor?: string;
}

export default function MobileCollapsibleSection({
  title,
  subtitle,
  icon,
  headerValue,
  headerSubtext,
  children,
  defaultOpen = false,
  className = '',
  headerClassName = '',
  accentColor = '#D4AF37'
}: MobileCollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={`glass-card border-[${accentColor}]/20 bg-gradient-to-b from-[#050505] to-[#0a0a0a] overflow-hidden ${className}`}>
      {/* Collapsible Header - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 flex items-center justify-between min-h-[72px] text-left transition-colors hover:bg-white/5 ${headerClassName}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: accentColor }}>
              {title}
            </p>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Header Value (shown when collapsed) */}
          {!isOpen && headerValue && (
            <div className="text-right">
              <p 
                className="text-lg font-bold font-mono"
                style={{ color: accentColor }}
              >
                {headerValue}
              </p>
              {headerSubtext && (
                <p className="text-[9px] text-muted-foreground">{headerSubtext}</p>
              )}
            </div>
          )}

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Collapsible Content - Only render when open (lazy loading) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
