import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export default function Timer({ expiresAt, onExpire }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const onExpireRef = useRef(onExpire);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setTimeRemaining(remaining);

      if (remaining === 0) {
        onExpireRef.current();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  const isWarning = minutes < 5;
  const isDanger = minutes < 2;

  return (
    <div
      className="row"
      style={{
        gap: 8,
        padding: '8px 16px',
        borderRadius: 8,
        backgroundColor: isDanger
          ? 'var(--danger-color)'
          : isWarning
          ? 'var(--warning-color)'
          : 'var(--bg-secondary)',
        color: isDanger || isWarning ? 'white' : 'inherit',
        fontWeight: 600,
      }}
    >
      <Clock size={16} />
      <span>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
