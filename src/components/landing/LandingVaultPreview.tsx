import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Lock } from 'lucide-react';

const vaultMetrics = [
  {
    icon: Wallet,
    label: 'Vault Balance',
    value: '₱ 0.00',
    color: 'text-[#D4AF37]',
    iconColor: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/10'
  },
  {
    icon: Lock,
    label: 'Frozen Holdings',
    value: '₱ 0.00',
    color: 'text-gray-400',
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-800/50'
  },
  {
    icon: TrendingUp,
    label: 'Active Yield',
    value: '+0.5%',
    color: 'text-[#00FF41]',
    iconColor: 'text-[#00FF41]',
    bgColor: 'bg-[#00FF41]/10'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

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

export default function LandingVaultPreview() {
  return (
    <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-[#0a1020] to-[#050505]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
            <Wallet className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs text-[#D4AF37] uppercase tracking-[0.15em]">
              Dashboard Preview
            </span>
          </div>
          
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            <span className="text-white">Your Sovereign</span>
            <span className="text-[#D4AF37]"> Vault</span>
          </h2>
          
          <p className="text-gray-400 max-w-xl mx-auto">
            Track your assets in real-time with our institutional-grade dashboard interface.
          </p>
        </motion.div>

        {/* Vault Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative"
        >
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20 rounded-2xl blur-xl opacity-50" />
          
          <div className="relative border border-[#D4AF37]/20 bg-[#0a0a0a]/90 backdrop-blur-xl rounded-2xl p-8 md:p-12 shadow-2xl">
            {/* Header Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex items-center gap-3 mb-10 origin-left"
            >
              <div className="w-12 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/30" />
              <span className="text-[10px] text-[#D4AF37]/60 uppercase tracking-[0.2em]">
                Consolidated Holdings
              </span>
            </motion.div>

            {/* Metrics Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {vaultMetrics.map((metric) => (
                <motion.div
                  key={metric.label}
                  variants={itemVariants}
                  className="relative p-6 rounded-xl border border-gray-800 bg-[#050505]/50 hover:border-[#D4AF37]/30 transition-all duration-300 group"
                >
                  <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] mb-2">
                    {metric.label}
                  </p>
                  <p 
                    className={`text-2xl md:text-3xl font-bold ${metric.color}`}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {metric.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between"
            >
              <span className="text-xs text-gray-600">Live data syncs every 15 seconds</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
                <span className="text-xs text-[#00FF41]">System Online</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
