'use client';

import { useState, useEffect } from 'react';
import { Participant } from '@/lib/use-room';

interface CounterCardProps {
  participant: Participant;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function CounterCard({
  participant,
  onIncrement,
  onDecrement,
}: CounterCardProps) {
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string }[]>([])
  const [nextId, setNextId] = useState(0);

  const handleIncrement = () => {
    onIncrement();

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    // Floating text animation
    const id = nextId;
    setFloatingTexts((prev) => [...prev, { id, text: '+1' }]);
    setNextId(id + 1);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 1000);

    // Play optional sound effect
    playPop();
  };

  const handleDecrement = () => {
    if (participant.piezas > 0) {
      onDecrement();
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
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

  return (
    <div className="relative w-full mb-8">
      {floatingTexts.map((floatText) => (
        <div
          key={floatText.id}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-up pointer-events-none"
        >
          <span className="text-3xl font-bold text-primary">+1 🍣</span>
        </div>
      ))}

      <div className="bg-white/60 backdrop-blur-md border-2 border-white/40 rounded-3xl p-8 shadow-lg">
        <p className="text-center text-muted-foreground text-lg mb-4">{participant.nombre}</p>

        <div className="text-center mb-8">
          <div className="inline-block">
            <p className="text-7xl font-bold text-primary mb-2">{participant.piezas}</p>
            <p className="text-2xl">🍣</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleDecrement}
            disabled={participant.piezas === 0}
            className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl text-2xl transition-all duration-150 active:scale-95 transform hover:shadow-lg"
          >
            −
          </button>

          <button
            onClick={handleIncrement}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-6 rounded-2xl text-2xl transition-all duration-150 active:scale-95 transform hover:shadow-lg animate-pulse-glow"
          >
            +
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ¡Presiona para contar tus piezas!
      </p>
    </div>
  );
}
