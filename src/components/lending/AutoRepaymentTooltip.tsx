/**
 * Animated 'How It Works' Tooltip for Auto-Repayment System
 * Step-by-step explanation of the 28-day auto-settlement process
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, Shield, Clock, CheckCircle, 
  Wallet, AlertTriangle, ArrowDown, Zap 
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const steps = [
  {
    icon: Wallet,
    title: "1. Capital Deployed",
    description: "You fund a borrower's loan request. Your capital is transferred to the borrower.",
    color: "#D4AF37",
    delay: 0
  },
  {
    icon: Clock,
    title: "2. 28-Day Term Begins",
    description: "The borrower has exactly 28 days to repay principal + interest.",
    color: "#00FF41",
    delay: 0.15
  },
  {
    icon: AlertTriangle,
    title: "3. Default Detection",
    description: "If Day 28 passes without repayment, the system flags the loan as defaulted.",
    color: "#FF6B35",
    delay: 0.3
  },
  {
    icon: Shield,
    title: "4. Reserve Fund Activation",
    description: "The Reserve Fund automatically triggers, preparing to cover your investment.",
    color: "#00FF41",
    delay: 0.45
  },
  {
    icon: Zap,
    title: "5. Instant Payout",
    description: "You receive 100% of your principal + earned interest. Zero loss guaranteed.",
    color: "#00FF41",
    delay: 0.6
  }
];

export default function AutoRepaymentTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button 
          className="inline-flex items-center gap-1 text-[#00FF41]/70 hover:text-[#00FF41] transition-colors cursor-pointer"
          aria-label="How Auto-Repayment Works"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider underline underline-offset-2">
            How It Works
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-[#0a0a0a] border-[#00FF41]/30 shadow-2xl z-50"
        align="center"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#00FF41]/20 bg-gradient-to-r from-[#00FF41]/10 to-transparent">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00FF41]" />
            <h3 className="text-sm font-bold text-[#00FF41] uppercase tracking-wider">
              28-Day Auto-Settlement
            </h3>
          </div>
          <p className="text-[10px] text-[#00FF41]/60 mt-1">
            Your capital is protected at every step
          </p>
        </div>

        {/* Steps */}
        <div className="p-4 space-y-0">
          <AnimatePresence>
            {isOpen && steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: step.delay,
                  ease: "easeOut"
                }}
                className="relative"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.3, delay: step.delay + 0.2 }}
                    className="absolute left-[14px] top-8 w-[2px] h-8 origin-top"
                    style={{ background: `linear-gradient(to bottom, ${step.color}40, ${steps[index + 1].color}40)` }}
                  />
                )}
                
                <div className="flex items-start gap-3 pb-3">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: step.delay + 0.1,
                      type: "spring",
                      stiffness: 200
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border"
                    style={{ 
                      backgroundColor: `${step.color}15`,
                      borderColor: `${step.color}40`
                    }}
                  >
                    <step.icon className="w-3.5 h-3.5" style={{ color: step.color }} />
                  </motion.div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{step.title}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer Guarantee */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="p-3 border-t border-[#00FF41]/20 bg-[#00FF41]/5"
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#00FF41]" />
            <span className="text-[10px] font-bold text-[#00FF41] uppercase tracking-wider">
              100% Principal + Interest Guaranteed
            </span>
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
