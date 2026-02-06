import { motion } from 'framer-motion';

export default function LandingVaultPreview() {
  return (
    <section className="relative z-10 py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="border border-[#D4AF37]/10 bg-[#050505]/80 backdrop-blur-sm p-8 md:p-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[2px] bg-[#D4AF37]" />
            <span className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.2em]">
              Dashboard Preview
            </span>
          </div>

          <h3 className="text-lg md:text-xl font-bold text-[#D4AF37] uppercase tracking-[0.15em] mb-8">
            Consolidated Vault Holdings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">
                Vault Balance
              </p>
              <p className="text-2xl font-mono font-bold text-[#D4AF37]">
                ₱ 0.00
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">
                Frozen Holdings
              </p>
              <p className="text-2xl font-mono font-bold text-gray-500">
                ₱ 0.00
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">
                Active Yield
              </p>
              <p className="text-2xl font-mono font-bold text-[#00FF41]">
                +0.5%
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
