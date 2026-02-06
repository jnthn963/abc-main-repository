/**
 * Loan Status Badge Component
 * Visual indicators for loan states with animated effects
 * OPEN/WAITING: Yellow pulse effect
 * FUNDED/ACTIVE: Solid green badge
 */

import { motion } from "framer-motion";
import { Clock, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type LoanStatus = 'open' | 'funded' | 'repaid' | 'defaulted' | 'pending_review';

interface LoanStatusBadgeProps {
  status: LoanStatus;
  daysRemaining?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<LoanStatus, {
  label: string;
  secondaryLabel?: string;
  icon: typeof Clock;
  baseClass: string;
  animate?: boolean;
}> = {
  open: {
    label: 'WAITING',
    secondaryLabel: 'Open for Funding',
    icon: Loader2,
    baseClass: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    animate: true,
  },
  funded: {
    label: 'ACTIVE',
    secondaryLabel: 'Funded',
    icon: CheckCircle,
    baseClass: 'bg-[#00FF41]/20 text-[#00FF41] border-[#00FF41]/30',
    animate: false,
  },
  repaid: {
    label: 'SETTLED',
    secondaryLabel: 'Repaid',
    icon: CheckCircle,
    baseClass: 'bg-success/20 text-success border-success/30',
    animate: false,
  },
  defaulted: {
    label: 'DEFAULTED',
    secondaryLabel: 'Auto-Settled',
    icon: AlertTriangle,
    baseClass: 'bg-destructive/20 text-destructive border-destructive/30',
    animate: false,
  },
  pending_review: {
    label: 'PENDING',
    secondaryLabel: 'Under Review',
    icon: Clock,
    baseClass: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30',
    animate: true,
  },
};

const sizeClasses = {
  sm: 'text-[9px] px-2 py-0.5 gap-1',
  md: 'text-[10px] px-2.5 py-1 gap-1.5',
  lg: 'text-xs px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export default function LoanStatusBadge({ 
  status, 
  daysRemaining, 
  className,
  size = 'md' 
}: LoanStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  // For funded status, show days remaining if provided
  const displayLabel = status === 'funded' && daysRemaining !== undefined 
    ? `${daysRemaining}d left` 
    : config.label;

  // Warning state for low days remaining
  const isUrgent = status === 'funded' && daysRemaining !== undefined && daysRemaining <= 5;
  const urgentClass = isUrgent ? 'bg-destructive/20 text-destructive border-destructive/30' : '';

  return (
    <motion.div
      className={cn(
        'inline-flex items-center rounded-full border font-semibold uppercase tracking-wider',
        sizeClasses[size],
        urgentClass || config.baseClass,
        className
      )}
      animate={config.animate ? {
        boxShadow: [
          '0 0 0 0 rgba(234, 179, 8, 0)',
          '0 0 8px 2px rgba(234, 179, 8, 0.3)',
          '0 0 0 0 rgba(234, 179, 8, 0)',
        ],
      } : undefined}
      transition={config.animate ? {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
    >
      <Icon 
        className={cn(
          iconSizes[size],
          config.animate && 'animate-spin'
        )} 
        style={config.animate ? { animationDuration: '3s' } : undefined}
      />
      <span>{displayLabel}</span>
    </motion.div>
  );
}

// Helper to get days remaining from due date
export function getDaysRemaining(dueAt: Date | null): number {
  if (!dueAt) return 0;
  return Math.max(0, Math.ceil((dueAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}
