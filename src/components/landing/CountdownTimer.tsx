import { useState, useEffect } from 'react';

// Founding Alpha countdown target: March 31, 2026
const FOUNDING_ALPHA_END = new Date('2026-03-31T23:59:59');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="px-3 py-2 min-w-[56px] border border-[#D4AF37]/20 bg-[#0a0a0a]">
        <span className="text-2xl md:text-3xl font-mono font-bold text-[#D4AF37]">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] text-[#D4AF37]/50 mt-2 uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = FOUNDING_ALPHA_END.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(difference / (1000 * 60 * 60) % 24),
          minutes: Math.floor(difference / 1000 / 60 % 60),
          seconds: Math.floor(difference / 1000 % 60)
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-2 md:gap-3 justify-center">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-2xl text-[#D4AF37]/30 self-start mt-2">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-2xl text-[#D4AF37]/30 self-start mt-2">:</span>
      <TimeBlock value={timeLeft.minutes} label="Min" />
      <span className="text-2xl text-[#D4AF37]/30 self-start mt-2">:</span>
      <TimeBlock value={timeLeft.seconds} label="Sec" />
    </div>
  );
}
