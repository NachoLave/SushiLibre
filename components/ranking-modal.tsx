'use client';

import { useState } from 'react';
import { Room } from '@/lib/use-room';
import { saveSession, getUserHistory } from '@/lib/storage';
import Link from 'next/link';

interface RankingModalProps {
  room: Room;
  currentUserId: string;
  onBackHome: () => void;
}

export default function RankingModal({
  room,
  currentUserId,
  onBackHome,
}: RankingModalProps) {
  const [saved, setSaved] = useState(false);

  const sorted = [...room.participantes].sort((a, b) => b.piezas - a.piezas);
  const currentParticipant = room.participantes.find((p) => p.id === currentUserId);

  const handleSaveSession = () => {
    if (currentParticipant) {
      const session = {
        idSala: room.id,
        fecha: new Date().toLocaleDateString('es-ES'),
        participantes: sorted,
        tuPuntaje: currentParticipant.piezas,
        tuNombre: currentParticipant.nombre,
      };

      saveSession(session);
      setSaved(true);

      setTimeout(() => {
        onBackHome();
      }, 1500);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-bounce">
          <div className="text-7xl">🏆</div>
        </div>

        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl p-8 shadow-lg mb-6">
          <h1 className="text-3xl font-bold text-foreground text-center mb-2">¡Batalla Terminada!</h1>
          <p className="text-center text-muted-foreground mb-6">Aquí está el ranking final</p>

          <div className="space-y-3 mb-8">
            {sorted.map((participant, index) => {
              const medal =
                index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯';
              const isYou = participant.id === currentUserId;

              return (
                <div
                  key={`${participant.id}-${index}`}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                    isYou
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{medal}</span>
                    <div>
                      <p className="font-semibold text-foreground">{participant.nombre}</p>
                      {isYou && <p className="text-xs text-primary">Eres tú</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{participant.piezas}</p>
                    <p className="text-xs text-muted-foreground">piezas</p>
                  </div>
                </div>
              );
            })}
          </div>

          {currentParticipant && (
            <div className="bg-accent/10 rounded-2xl p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Tu resultado</p>
              <p className="text-3xl font-bold text-accent">{currentParticipant.piezas} 🍣</p>
              <p className="text-xs text-muted-foreground mt-2">
                Posición: #{sorted.findIndex((p) => p.id === currentUserId) + 1}
              </p>
            </div>
          )}

          <button
            onClick={handleSaveSession}
            disabled={saved}
            className="w-full bg-secondary hover:bg-secondary/90 disabled:bg-green-500 text-secondary-foreground disabled:text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-lg"
          >
            {saved ? '✓ Guardado en historial' : '💾 Guardar Sesión'}
          </button>
        </div>

        <Link href="/" className="block text-center text-primary hover:text-primary/80 font-medium">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
