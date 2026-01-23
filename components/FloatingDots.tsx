'use client';

import { useEffect, useState } from 'react';

export default function FloatingDots() {
  const [dots, setDots] = useState<Array<{
    id: number;
    size: number;
    left: number;
    opacity: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const newDots = [];
    for (let i = 0; i < 15; i++) {
      newDots.push({
        id: i,
        size: Math.floor(Math.random() * 8) + 4,
        left: Math.floor(Math.random() * 100),
        opacity: Math.random() * 0.3 + 0.1,
        duration: Math.floor(Math.random() * 15) + 15,
        delay: Math.floor(Math.random() * 10),
      });
    }
    setDots(newDots);
  }, []);

  return (
    <section className="floating-dots absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="dot absolute bg-white rounded-full animate-float-up"
          style={{
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            left: `${dot.left}%`,
            // @ts-ignore
            '--opacity': dot.opacity,
            '--duration': `${dot.duration}s`,
            animationDelay: `${dot.delay}s`,
            bottom: '-20px', // Start from bottom
          }}
        />
      ))}
    </section>
  );
}
