/**
 * Clearing Timer Component
 * Displays countdown for 24-hour clearing period
 */

import { useState, useEffect, useMemo } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ClearingTimerProps {
  targetTime: Date;
  onComplete?: () => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ClearingTimer = ({ 
  targetTime, 
  onComplete, 
  showLabel = true,
  size = 'md' 
}: ClearingTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(
    Math.max(0, targetTime.getTime() - Date.now())
  );

  const isComplete = timeRemaining <= 0;

  useEffect(() => {
    if (isComplete) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, targetTime.getTime() - Date.now());
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete, isComplete]);

  const formattedTime = useMemo(() => {
    if (isComplete) return "Completed";

    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining, isComplete]);

  // Calculate progress percentage (24 hours = 100%)
  const progressPercent = useMemo(() => {
    const totalDuration = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.min(100, 100 - (timeRemaining / totalDuration) * 100));
  }, [timeRemaining]);

  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'w-3 h-3',
      text: 'text-xs',
      time: 'text-sm',
    },
    md: {
      container: 'p-3',
      icon: 'w-4 h-4',
      text: 'text-sm',
      time: 'text-lg',
    },
    lg: {
      container: 'p-4',
      icon: 'w-5 h-5',
      text: 'text-base',
      time: 'text-2xl',
    },
  };

  const classes = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg ${classes.container} ${
        isComplete 
          ? 'bg-success/10 border border-success/30' 
          : 'bg-yellow-500/10 border border-yellow-500/30'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {isComplete ? (
          <CheckCircle className={`${classes.icon} text-success`} />
        ) : (
          <Clock className={`${classes.icon} text-yellow-500 animate-pulse`} />
        )}
        {showLabel && (
          <span className={`${classes.text} ${isComplete ? 'text-success' : 'text-yellow-500'}`}>
            {isComplete ? 'Cleared' : 'Clearing Period'}
          </span>
        )}
      </div>

      <div className={`font-mono font-bold ${classes.time} ${
        isComplete ? 'text-success' : 'text-yellow-500'
      }`}>
        {formattedTime}
      </div>

      {/* Progress Bar */}
      {!isComplete && (
        <div className="mt-2">
          <div className="h-1.5 bg-yellow-500/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-yellow-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ClearingTimer;
