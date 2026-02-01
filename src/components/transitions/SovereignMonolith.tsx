import { motion } from "framer-motion";

interface SovereignMonolithProps {
  message?: string;
}

export function SovereignMonolith({ message = "INITIALIZING SOVEREIGN TERMINAL..." }: SovereignMonolithProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a12]/95 backdrop-blur-xl">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-[#0d0d1a] to-[#0a0a12]" />
      
      {/* Animated glow rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute w-64 h-64 rounded-full border border-[#D4AF37]/10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute w-48 h-48 rounded-full border border-[#D4AF37]/20"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 0.2,
          }}
        />
      </div>

      {/* Central Monolith */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Gold Geometric Logo - Breathing Animation */}
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          {/* Outer glow */}
          <div className="absolute inset-0 blur-xl bg-[#D4AF37]/20 rounded-2xl" />
          
          {/* Main geometric shape */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Diamond shape with gold gradient */}
            <motion.div
              className="absolute w-16 h-16 rotate-45"
              style={{
                background: 'linear-gradient(135deg, #F5D76E 0%, #D4AF37 50%, #8B7500 100%)',
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)',
              }}
            />
            
            {/* Inner geometric accent */}
            <motion.div
              className="absolute w-8 h-8 rotate-45 border-2 border-[#0a0a12]"
              style={{
                background: 'linear-gradient(135deg, #8B7500 0%, #D4AF37 50%, #F5D76E 100%)',
              }}
            />
            
            {/* ABC Text */}
            <div 
              className="relative z-10 text-lg font-bold tracking-widest"
              style={{
                background: 'linear-gradient(180deg, #0a0a12 0%, #1a1a2e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 1px rgba(0,0,0,0.5)',
              }}
            >
              ABC
            </div>
          </div>
        </motion.div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-3">
          <motion.p
            className="text-xs tracking-[0.3em] font-medium"
            style={{
              background: 'linear-gradient(90deg, #8B7500 0%, #D4AF37 50%, #F5D76E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            {message}
          </motion.p>
          
          {/* Progress bar */}
          <div className="w-48 h-0.5 bg-[#1a1a2e] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #8B7500 0%, #D4AF37 50%, #F5D76E 100%)',
              }}
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SovereignMonolith;
