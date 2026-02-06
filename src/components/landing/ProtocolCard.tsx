import { motion } from 'framer-motion';
import { LucideIcon, Shield, CheckCircle } from 'lucide-react';

interface ProtocolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
  highlight?: string | null;
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const
    }
  }
};

export default function ProtocolCard({ icon: Icon, title, description, index, highlight }: ProtocolCardProps) {
  const isHighlighted = highlight === 'AUTO-REPAYMENT';
  
  return (
    <motion.div
      variants={itemVariants}
      className={`relative p-6 border bg-[#0a0a0a]/80 backdrop-blur-sm transition-all duration-300 rounded-xl group overflow-hidden ${
        isHighlighted 
          ? 'border-[#00FF41]/40 hover:border-[#00FF41]/60' 
          : 'border-[#D4AF37]/10 hover:border-[#D4AF37]/40'
      }`}
    >
      {/* Highlight badge */}
      {isHighlighted && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          viewport={{ once: true }}
          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-[#00FF41]/20 border border-[#00FF41]/40"
        >
          <Shield className="w-3 h-3 text-[#00FF41]" />
          <span className="text-[9px] font-bold text-[#00FF41] uppercase tracking-wider">Protected</span>
        </motion.div>
      )}
      
      {/* Subtle glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        isHighlighted ? 'from-[#00FF41]/10' : 'from-[#D4AF37]/5'
      }`} />
      
      {/* Animated glow for highlighted card */}
      {isHighlighted && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#00FF41]/5 via-transparent to-[#00FF41]/5 animate-pulse opacity-30" />
      )}
      
      <div className="relative">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
          viewport={{ once: true }}
          className={`w-12 h-12 rounded-lg border flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 ${
            isHighlighted 
              ? 'bg-[#00FF41]/10 border-[#00FF41]/30 group-hover:bg-[#00FF41]/20' 
              : 'bg-[#D4AF37]/10 border-[#D4AF37]/20 group-hover:bg-[#D4AF37]/20'
          }`}
        >
          <Icon className={`w-5 h-5 ${isHighlighted ? 'text-[#00FF41]' : 'text-[#D4AF37]'}`} />
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          viewport={{ once: true }}
          className={`w-8 h-[2px] mb-4 origin-left ${
            isHighlighted 
              ? 'bg-gradient-to-r from-[#00FF41] to-[#00FF41]/30' 
              : 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/30'
          }`}
        />

        <h3 className={`text-sm font-semibold uppercase tracking-[0.15em] mb-3 ${
          isHighlighted ? 'text-[#00FF41]' : 'text-[#D4AF37]'
        }`}>
          {title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          {description}
        </p>
        
        {/* Auto-Repayment guarantee message for highlighted card */}
        {isHighlighted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 pt-3 border-t border-[#00FF41]/20"
          >
            <CheckCircle className="w-4 h-4 text-[#00FF41]" />
            <span className="text-[11px] text-[#00FF41] font-medium">
              100% Auto-Repayment Guarantee
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
