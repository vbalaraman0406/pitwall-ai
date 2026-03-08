import React, { useState, useEffect } from 'react';

/** @description Top navigation bar with next race countdown timer. */
export default function Navbar() {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const nextRace = new Date('2025-07-06T14:00:00Z'); // British GP 2025
    const raceName = 'British Grand Prix';

    const timer = setInterval(() => {
      const now = new Date();
      const diff = nextRace - now;
      if (diff <= 0) {
        setCountdown('Race in progress!');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${raceName}: ${days}d ${hours}h ${mins}m ${secs}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between mb-8">
      <div />
      <div className="bg-f1-card border border-gray-800 rounded-lg px-4 py-2">
        <span className="text-xs text-f1-muted mr-2">NEXT RACE</span>
        <span className="text-sm font-mono text-white">{countdown}</span>
      </div>
    </div>
  );
}
