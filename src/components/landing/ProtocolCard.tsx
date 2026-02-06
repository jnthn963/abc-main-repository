import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ProtocolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
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

export default function ProtocolCard({ icon: Icon, title, description, index }: ProtocolCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="relative p-6 border border-[#D4AF37]/10 bg-[#0a0a0a]/80 backdrop-blur-sm hover:border-[#D4AF37]/40 transition-all duration-300 rounded-xl group overflow-hidden"
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
          viewport={{ once: true }}
          className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 group-hover:scale-110 transition-all duration-300"
        >
          <Icon className="w-5 h-5 text-[#D4AF37]" />
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          viewport={{ once: true }}
          className="w-8 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/30 mb-4 origin-left"
        />

        <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-[0.15em] mb-3">
          {title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
