import { motion } from 'framer-motion';

interface ProtocolCardProps {
  title: string;
  description: string;
}

export default function ProtocolCard({ title, description }: ProtocolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="p-6 border border-[#D4AF37]/10 bg-[#050505]/80 backdrop-blur-sm hover:border-[#D4AF37]/30 transition-all duration-300"
    >
      <div className="w-8 h-[2px] bg-[#D4AF37] mb-4" />
      <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-[0.15em] mb-3">
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
