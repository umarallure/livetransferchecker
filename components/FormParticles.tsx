'use client';

import { useEffect, useRef } from 'react';

export default function FormParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const parent = container.parentElement;
    if (!parent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const size = Math.random() * 8 + 3;
      const particle = document.createElement('div');
      particle.classList.add('particle');
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.animation = 'particle-fade 1s forwards';
      
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    };

    parent.addEventListener('mousemove', handleMouseMove);

    return () => {
      parent.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="particles-container absolute inset-0 overflow-hidden pointer-events-none z-0" 
      id="particlesContainer"
    />
  );
}
