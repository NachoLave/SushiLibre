'use client';

import { useState, useRef, useEffect } from 'react';
import type { Participant } from '@/lib/room-types';
import AnimatedSushi from './animated-sushi';

interface FullScreenCounterProps {
  participant: Participant;
  onIncrement: () => void;
  onDecrement: () => void;
  participants: Participant[];
}

export default function FullScreenCounter({
  participant,
  onIncrement,
  onDecrement,
  participants,
}: FullScreenCounterProps) {
  const [floatingTexts, setFloatingTexts] = useState<
    { id: number; text: string; x: number; y: number }[]
  >([]);
  const [fallingSushi, setFallingSushi] = useState<
    { id: number; x: number; startY: number; rotation: number }[]
  >([]);
  const [isEating, setIsEating] = useState(false);
  const [nextId, setNextId] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScreenTap = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const relativeX = x - rect.left;
    const relativeY = y - rect.top;

    onIncrement();

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    // Animación de comer
    setIsEating(true);
    setTimeout(() => setIsEating(false), 600);

    // Floating text animation
    const id = nextId;
    setFloatingTexts((prev) => [...prev, { id, text: '+1', x: relativeX, y: relativeY }]);
    setNextId(id + 1);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 1200);

    // Crear piezas de sushi cayendo
    const sushiCount = 3 + Math.floor(Math.random() * 3); // 3-5 piezas
    for (let i = 0; i < sushiCount; i++) {
      const sushiId = nextId + i + 1000;
      const startX = relativeX + (Math.random() - 0.5) * 100;
      const rotation = (Math.random() - 0.5) * 360;
      
      setFallingSushi((prev) => [
        ...prev,
        { id: sushiId, x: startX, startY: -20, rotation },
      ]);

      setTimeout(() => {
        setFallingSushi((prev) => prev.filter((s) => s.id !== sushiId));
      }, 2000);
    }
    setNextId(nextId + sushiCount + 1000);

    // Play eating sound
    playEatingSound();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;

    // Swipe down to decrement
    if (diff < -50) {
      onDecrement();
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    }

    setTouchStart(null);
  };

  const playEatingSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      // Sonido de masticar (múltiples osciladores para sonido más realista)
      for (let i = 0; i < 3; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        // Frecuencia que simula masticar
        const baseFreq = 150 + i * 50;
        osc.frequency.setValueAtTime(baseFreq, now + i * 0.05);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + i * 0.05 + 0.08);
        
        gain.gain.setValueAtTime(0.15, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.08);
        
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.08);
      }
    } catch (error) {
      // Audio context not available
    }
  };

  const otherParticipants = participants.filter((p) => p.id !== participant.id);

  return (
    <div
      ref={containerRef}
      onClick={handleScreenTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex-1 relative w-full bg-gradient-to-b from-pink-50 via-blue-50 to-white flex flex-col items-center justify-center cursor-pointer overflow-hidden"
    >
      {/* Floating text animations */}
      {floatingTexts.map((floatText) => (
        <div
          key={floatText.id}
          className="absolute animate-float-up pointer-events-none"
          style={{
            left: `${floatText.x}px`,
            top: `${floatText.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="text-3xl font-bold text-primary">+1</span>
        </div>
      ))}

      {/* Piezas de sushi cayendo */}
      {fallingSushi.map((sushi) => (
        <div
          key={sushi.id}
          className="absolute animate-fall pointer-events-none z-10"
          style={{
            left: `${sushi.x}px`,
            top: `${sushi.startY}px`,
            transform: `rotate(${sushi.rotation}deg)`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" className="drop-shadow-sm">
            <rect x="6" y="8" width="12" height="12" rx="6" ry="6" fill="#1a1a1a" />
            <circle cx="12" cy="14" r="5" fill="#f5f5dc" />
            <ellipse cx="12" cy="13" rx="3.5" ry="2.5" fill="#ff9966" />
          </svg>
        </div>
      ))}

      {/* Participants list - top right */}
      {otherParticipants.length > 0 && (
        <div className="absolute top-4 right-4 space-y-2 max-h-48 overflow-y-auto">
          {otherParticipants.map((p) => (
            <div
              key={p.id}
              className="bg-white/40 backdrop-blur-md border border-white/40 rounded-xl px-3 py-2 text-right"
            >
              <p className="text-xs font-medium text-foreground truncate w-32">{p.nombre}</p>
              <p className="text-lg font-bold text-primary">{p.piezas}</p>
              {p.finalizado && (
                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Center - Animated sushi and counter */}
      <div className="flex flex-col items-center gap-8">
        <AnimatedSushi isEating={isEating} />

        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2 font-medium">{participant.nombre}</p>
          <div className="text-8xl font-bold text-primary tracking-tight">
            {participant.piezas}
          </div>
          <p className="text-2xl mt-2 opacity-60">🍣</p>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground font-medium">
          Toca para sumar • Desliza hacia abajo para restar
        </p>
      </div>
    </div>
  );
}
