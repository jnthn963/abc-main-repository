import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, ChevronRight, X } from "lucide-react";
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
    title: "Make a Deposit",
    description: "Start by depositing funds into your Alpha Vault to earn daily interest.",
    position: { top: "80px", right: "20px" },
    fingerPosition: { top: "55px", right: "140px" },
  },
  {
    id: 2,
    target: "vault-balance",
    title: "Your Vault Balance",
    description: "Watch your money grow with 0.5% daily compounding interest!",
    position: { top: "200px", left: "320px" },
    fingerPosition: { top: "140px", left: "200px" },
  },
  {
    id: 3,
    target: "marketplace",
    title: "Alpha Marketplace",
    description: "Browse loan requests and lend to fellow members for premium returns.",
    position: { top: "200px", left: "50%" },
    fingerPosition: { top: "140px", left: "480px" },
  },
  {
    id: 4,
    target: "transfer-funds",
    title: "Transfer Funds",
    description: "Send to banks, e-wallets, or other Alpha members instantly.",
    position: { top: "420px", left: "200px" },
    fingerPosition: { top: "380px", left: "100px" },
  },
  {
    id: 5,
    target: "news-feed",
    title: "Sovereign Feed",
    description: "Stay updated with announcements and live system activity.",
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
    // Gold coin confetti burst!
    const goldColors = ["#FFD700", "#FFA500", "#F5A623", "#FFCC00", "#DAA520"];
    
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

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
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
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
                className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg glow-gold"
              >
                <Hand className="w-7 h-7 text-primary-foreground transform rotate-[-15deg]" />
              </motion.div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-primary/30 pulse-ring" />
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
            <div className="glass-card border-primary/40 p-4 shadow-2xl">
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  {tutorialSteps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentStep ? "bg-primary" : idx < currentStep ? "bg-success" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} of {tutorialSteps.length}
                </span>
              </div>

              <h4 className="font-bold text-foreground mb-1">{step.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-2 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg font-semibold text-primary-foreground text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                >
                  {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
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
