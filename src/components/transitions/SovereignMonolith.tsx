import { motion } from "framer-motion";
import abcLogo from "@/assets/abc-logo.png";

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
        {/* Official ABC Logo - Breathing Animation */}
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
          {/* Official Logo */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <img 
              src={abcLogo} 
              alt="Alpha Bankers Cooperative" 
              className="w-32 h-32 object-contain drop-shadow-[0_0_40px_rgba(212,175,55,0.5)]"
            />
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
