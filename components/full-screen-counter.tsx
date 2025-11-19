'use client';

import { useState, useRef, useEffect } from 'react';
import { Participant } from '@/lib/use-room';
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

    // Floating text animation
    const id = nextId;
    setFloatingTexts((prev) => [...prev, { id, text: '+1', x: relativeX, y: relativeY }]);
    setNextId(id + 1);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 1200);

    // Play pop sound
    playPop();
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

  const playPop = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
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
        <AnimatedSushi />

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
