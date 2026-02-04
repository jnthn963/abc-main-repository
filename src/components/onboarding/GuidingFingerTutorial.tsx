import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";

interface TutorialStep {
  id: number;
  target: string;
  title: string;
  description: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  fingerPosition: { top?: string; bottom?: string; left?: string; right?: string };
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    target: "deposit-btn",
    title: "Initialize Capital",
    description: "Begin by depositing funds into your Sovereign Vault to activate daily yield generation.",
    position: { top: "80px", right: "20px" },
    fingerPosition: { top: "55px", right: "140px" },
  },
  {
    id: 2,
    target: "vault-balance",
    title: "Consolidated Vault Holdings",
    description: "Monitor your sovereign capital with 0.5% daily compounding yield accrual.",
    position: { top: "200px", left: "320px" },
    fingerPosition: { top: "140px", left: "200px" },
  },
  {
    id: 3,
    target: "marketplace",
    title: "Capital Deployment Terminal",
    description: "Access the marketplace to deploy capital to fellow sovereigns for premium returns.",
    position: { top: "200px", left: "50%" },
    fingerPosition: { top: "140px", left: "480px" },
  },
  {
    id: 4,
    target: "transfer-funds",
    title: "Release Funds Protocol",
    description: "Transfer to external institutions or other Alpha members via secure channels.",
    position: { top: "420px", left: "200px" },
    fingerPosition: { top: "380px", left: "100px" },
  },
  {
    id: 5,
    target: "news-feed",
    title: "Sovereign Feed",
    description: "Monitor real-time system broadcasts and member activity across the network.",
    position: { top: "200px", right: "50px" },
    fingerPosition: { top: "140px", right: "300px" },
  },
];

const GuidingFingerTutorial = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      triggerCelebration();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete();
  };

  const triggerCelebration = () => {
    // Gold coin confetti burst - Sovereign celebration
    const goldColors = ["#FFD700", "#D4AF37", "#F5A623", "#FFCC00", "#DAA520"];
    
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsVisible(false);
        onComplete();
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: goldColors,
        shapes: ["circle"],
        scalar: 1.2,
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: goldColors,
        shapes: ["circle"],
        scalar: 1.2,
      });
    }, 50);

    // Big center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: goldColors,
      shapes: ["circle"],
      scalar: 1.5,
    });
  };

  const step = tutorialSteps[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050505]/80 backdrop-blur-sm z-40"
          />

          {/* Blinking Gold Finger */}
          <motion.div
            key={`finger-${currentStep}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={step.fingerPosition}
            className="fixed z-50"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #8B7500 100%)',
                  boxShadow: '0 0 25px rgba(212, 175, 55, 0.5)'
                }}
              >
                <Hand className="w-7 h-7 text-[#050505] transform rotate-[-15deg]" />
              </motion.div>
              {/* Pulsing ring */}
              <div 
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(212, 175, 55, 0.3)' }}
              />
            </div>
          </motion.div>

          {/* Tooltip Card */}
          <motion.div
            key={`tooltip-${currentStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={step.position}
            className="fixed z-50 w-72"
          >
            <div 
              className="rounded-xl p-4 shadow-2xl border border-[#D4AF37]/30"
              style={{ 
                background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.15)'
              }}
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  {tutorialSteps.map((_, idx) => (
                    <div
                      key={idx}
                      className="w-2 h-2 rounded-full transition-colors"
                      style={{
                        background: idx === currentStep 
                          ? '#D4AF37' 
                          : idx < currentStep 
                            ? '#00FF41' 
                            : 'rgba(255,255,255,0.2)'
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-[0.1em]">
                  Protocol {currentStep + 1}/{tutorialSteps.length}
                </span>
              </div>

              <h4 
                className="font-bold mb-1 uppercase tracking-[0.05em]"
                style={{ 
                  color: '#D4AF37',
                  fontFamily: 'Georgia, serif'
                }}
              >
                {step.title}
              </h4>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                {step.description}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-2 px-3 text-sm text-gray-500 hover:text-[#D4AF37] transition-colors uppercase tracking-[0.1em]"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-2.5 px-3 rounded-lg font-bold text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-1 transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: '#00FF41',
                    color: '#050505',
                    boxShadow: '0 0 15px rgba(0, 255, 65, 0.3)'
                  }}
                >
                  {currentStep === tutorialSteps.length - 1 ? "Complete" : "Continue"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GuidingFingerTutorial;
