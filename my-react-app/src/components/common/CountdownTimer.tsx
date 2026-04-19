import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import './CountdownTimer.css';

interface CountdownTimerProps {
  expiryDate: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiryDate }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiryDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      };
    };

    // Initial check
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime.isExpired) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!timeLeft || timeLeft.isExpired) return null;

  let timeString = '';
  if (timeLeft.days > 0) {
    timeString = `${timeLeft.days} ngày ${timeLeft.hours} tiếng`;
  } else if (timeLeft.hours > 0) {
    timeString = `${timeLeft.hours} tiếng ${timeLeft.minutes} phút`;
  } else {
    timeString = `${timeLeft.minutes} phút ${timeLeft.seconds} giây`;
  }

  return (
    <div className="countdown-timer-container">
      <Timer size={14} className="countdown-icon" />
      <span>
        Còn lại <strong>{timeString}</strong> ở mức giá này!
      </span>
    </div>
  );
};
