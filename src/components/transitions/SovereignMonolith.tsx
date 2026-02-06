/**
 * SOVEREIGN MONOLITH: 3D Text-Based Preloader
 * 
 * High-performance CSS-only 3D text loading effect.
 * No image assets - pure CSS and web fonts for near-zero initial load.
 * Features floating/breathing animation with metallic gold 3D effect.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SovereignMonolithProps {
  message?: string;
  isVisible?: boolean;
  onExitComplete?: () => void;
}

// Cycling status messages
const STATUS_MESSAGES = [
  "Architects of Financial Sovereignty...",
  "Securing the Life Blood Protocol...",
  "Synchronizing Vault Accruals...",
  "Verifying Reserve Integrity...",
  "Initializing Sovereign Terminal...",
];

export function SovereignMonolith({ 
  message, 
  isVisible = true,
  onExitComplete 
}: SovereignMonolithProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through status messages
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  const currentMessage = message || STATUS_MESSAGES[messageIndex];

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(10, 10, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Background gradient overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.08) 0%, transparent 60%)',
            }}
          />
          
          {/* 3D Container with perspective */}
          <div 
            className="relative z-10 flex flex-col items-center gap-8 px-4"
            style={{ perspective: '1000px' }}
          >
            {/* 3D Text - ALPHA BANKERS */}
            <motion.div
              className="relative"
              animate={{
                rotateX: [0, 3, 0, -3, 0],
                rotateY: [-2, 2, -2],
                z: [0, 20, 0],
              }}
              transition={{
                duration: 6,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Main 3D Text - ALPHA */}
              <h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.15em] select-none"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  color: '#C5A059',
                  textShadow: `
                    0 1px 0 #B8943E,
                    0 2px 0 #A6822D,
                    0 3px 0 #94701C,
                    0 4px 0 #826010,
                    0 5px 0 #705004,
                    0 6px 1px rgba(0,0,0,.1),
                    0 0 5px rgba(197, 160, 89, 0.4),
                    0 1px 3px rgba(0,0,0,.3),
                    0 3px 5px rgba(0,0,0,.2),
                    0 5px 10px rgba(0,0,0,.25),
                    0 10px 10px rgba(0,0,0,.2),
                    0 20px 20px rgba(0,0,0,.15),
                    0 0 40px rgba(212, 175, 55, 0.3)
                  `,
                  transform: 'translateZ(50px)',
                }}
              >
                ALPHA
              </h1>
              
              {/* Main 3D Text - BANKERS */}
              <h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.25em] select-none -mt-2 md:-mt-4"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 30%, #C5A059 60%, #8B7500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: `
                    0 0 40px rgba(212, 175, 55, 0.5),
                    0 0 80px rgba(212, 175, 55, 0.3)
                  `,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                  transform: 'translateZ(30px)',
                }}
              >
                BANKERS
              </h1>

              {/* Shine effect overlay */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                  transform: 'translateZ(60px)',
                }}
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 3,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            </motion.div>

            {/* Cooperative Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5"
            >
              <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
              <span 
                className="text-xs font-medium uppercase tracking-[0.2em]"
                style={{ color: '#D4AF37' }}
              >
                COOPERATIVE
              </span>
            </motion.div>

            {/* Cycling Status Message */}
            <motion.div 
              className="flex flex-col items-center gap-4 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs sm:text-sm tracking-[0.15em] text-center"
                  style={{
                    background: 'linear-gradient(90deg, #8B7500 0%, #D4AF37 50%, #F5D76E 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {currentMessage}
                </motion.p>
              </AnimatePresence>
              
              {/* Animated Progress Bar */}
              <div className="w-56 sm:w-64 h-0.5 bg-[#1a1a2e] rounded-full overflow-hidden">
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
            </motion.div>
          </div>

          {/* Ambient glow rings */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full border border-[#D4AF37]/5 pointer-events-none"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.05, 0.2],
            }}
            transition={{
              duration: 4,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full border border-[#D4AF37]/10 pointer-events-none"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 0.5,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SovereignMonolith;
