import { motion } from 'framer-motion';

export default function LandingManifesto() {
  return (
    <section className="relative z-10 py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-8" />
          <blockquote 
            className="text-lg md:text-xl italic mb-8"
            style={{ 
              color: '#D4AF37',
              fontFamily: 'Georgia, "Times New Roman", serif'
            }}
          >
            "Hindi na tayo magpapa-alipin sa barya. Tayo ang may-ari ng systema."
          </blockquote>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xl mx-auto">
            Alpha Bankers Cooperative is a sovereign digital cooperative engineered to return 
            the 48% interest "spread" that traditional banks keep for themselves back to the people.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
