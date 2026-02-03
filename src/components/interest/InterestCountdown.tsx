/**
 * Isolated Interest Countdown Component
 * 
 * STABILITY FIX: This component isolates the 1-second timer to prevent
 * re-rendering of parent components. Only this small component re-renders
 * every second, not the entire InterestDisplay.
 */

import { useState, useEffect, useCallback, memo } from "react";

interface InterestCountdownProps {
  className?: string;
}

// Calculate time until midnight
const getTimeUntilMidnight = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
};

const formatCountdown = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const InterestCountdown = memo(function InterestCountdown({ 
  className = "" 
}: InterestCountdownProps) {
  const [timeUntilNext, setTimeUntilNext] = useState(getTimeUntilMidnight);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilNext(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`font-mono ${className}`}>
      {formatCountdown(timeUntilNext)}
    </span>
  );
});

export default InterestCountdown;
