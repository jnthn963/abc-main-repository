/**
 * Mobile Audit Card - Card-based ledger entry for mobile view
 * Replaces table rows with tap-to-expand cards
 * Touch-friendly design with 48px minimum touch targets
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown,
  CheckCircle2,
  FileText,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Users,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  reference_number: string;
  description: string | null;
}

interface MobileAuditCardProps {
  entry: LedgerEntry;
}

const TRANSACTION_CONFIG: Record<string, { 
  icon: typeof TrendingUp; 
  color: string; 
  label: string;
  bgColor: string;
}> = {
  vault_interest: { 
    icon: TrendingUp, 
    color: 'text-[#00FF41]', 
    label: 'Vault Yield (0.5%)',
    bgColor: 'bg-[#00FF41]/10'
  },
  lending_profit: { 
    icon: Coins, 
    color: 'text-[#FFD700]', 
    label: 'Lending Synergy (+0.5%)',
    bgColor: 'bg-[#FFD700]/10'
  },
  deposit: { 
    icon: ArrowDownLeft, 
    color: 'text-emerald-400', 
    label: 'Capital Injection',
    bgColor: 'bg-emerald-400/10'
  },
  withdrawal: { 
    icon: ArrowUpRight, 
    color: 'text-red-400', 
    label: 'Sovereign Settlement',
    bgColor: 'bg-red-400/10'
  },
  transfer_in: { 
    icon: ArrowDownLeft, 
    color: 'text-blue-400', 
    label: 'Transfer Received',
    bgColor: 'bg-blue-400/10'
  },
  transfer_out: { 
    icon: ArrowUpRight, 
    color: 'text-orange-400', 
    label: 'Transfer Sent',
    bgColor: 'bg-orange-400/10'
  },
  referral_commission: { 
    icon: Users, 
    color: 'text-[#D4AF37]', 
    label: 'Patronage Reward (5%)',
    bgColor: 'bg-[#D4AF37]/10'
  },
  loan_funding: { 
    icon: Shield, 
    color: 'text-purple-400', 
    label: 'Loan Funded',
    bgColor: 'bg-purple-400/10'
  },
  loan_repayment: { 
    icon: CheckCircle2, 
    color: 'text-teal-400', 
    label: 'Loan Repayment',
    bgColor: 'bg-teal-400/10'
  },
  collateral_lock: { 
    icon: Shield, 
    color: 'text-amber-400', 
    label: 'Collateral Locked (50%)',
    bgColor: 'bg-amber-400/10'
  },
  collateral_release: { 
    icon: Shield, 
    color: 'text-green-400', 
    label: 'Collateral Released',
    bgColor: 'bg-green-400/10'
  },
};

export default function MobileAuditCard({ entry }: MobileAuditCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConfig = (type: string) => {
    return TRANSACTION_CONFIG[type] || { 
      icon: FileText, 
      color: 'text-gray-400', 
      label: type.replace(/_/g, ' ').toUpperCase(),
      bgColor: 'bg-gray-400/10'
    };
  };

  const formatAmount = (amount: number, type: string) => {
    const pesos = Math.floor(amount / 100);
    const isCredit = ['deposit', 'vault_interest', 'lending_profit', 'transfer_in', 'referral_commission', 'loan_repayment', 'collateral_release'].includes(type);
    const prefix = isCredit ? '+' : '-';
    return `${prefix}₱${Math.abs(pesos).toLocaleString('en-PH')}`;
  };

  const config = getConfig(entry.type);
  const Icon = config.icon;
  const isCredit = formatAmount(entry.amount, entry.type).startsWith('+');

  return (
    <motion.div
      className={`rounded-xl ${config.bgColor} border border-white/5 overflow-hidden`}
      layout
    >
      {/* Card Header - Always visible, tap to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between min-h-[72px] text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-black/40 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </p>
            <p className="text-[10px] text-gray-500 font-mono">
              {format(new Date(entry.created_at), 'MMM d, HH:mm')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className={`font-mono text-base font-bold ${isCredit ? 'text-[#00FF41]' : 'text-red-400'}`}>
            {formatAmount(entry.amount, entry.type)}
          </p>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Details - Only render when expanded (lazy loading) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-3">
              {/* Reference Number */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Reference
                </span>
                <span className="text-xs text-foreground font-mono">
                  {entry.reference_number}
                </span>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Status
                </span>
                <div className="flex items-center gap-1.5">
                  {entry.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF41]" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  <span className={`text-xs capitalize ${
                    entry.status === 'completed' ? 'text-[#00FF41]' : 'text-amber-400'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              {entry.description && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Description
                  </span>
                  <p className="text-xs text-foreground">
                    {entry.description}
                  </p>
                </div>
              )}

              {/* Full Date */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Date
                </span>
                <span className="text-xs text-foreground">
                  {format(new Date(entry.created_at), 'MMMM d, yyyy • HH:mm:ss')}
                </span>
              </div>

              {/* Verification Badge */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5">
                <Shield className="w-3 h-3 text-[#D4AF37]/60" />
                <span className="text-[9px] text-muted-foreground">
                  Verified by ABC Protocol
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
