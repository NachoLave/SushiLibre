'use client';

import { use, useState, useEffect } from 'react';
import { useRoom } from '@/lib/use-room';
import type { Participant } from '@/lib/room-types';
import { getOrCreateUserId } from '@/lib/storage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FullScreenCounter from '@/components/full-screen-counter';
import RankingModal from '@/components/ranking-modal';

export default function Room({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const { room, loading, error, updateParticipant, finishParticipant, finishRoom } = useRoom(roomId);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showRanking, setShowRanking] = useState(false);
  const [finishingStatus, setFinishingStatus] = useState<'idle' | 'finishing' | 'done'>('idle');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [localFinalized, setLocalFinalized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userId = getOrCreateUserId();
    setCurrentUserId(userId);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Cargando sala...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">{error}</p>
          <Link href="/" className="text-primary hover:text-primary/80 font-medium">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  if (!room) {
    return null;
  }

  const currentParticipant = room.participantes.find((p) => p.id === currentUserId);
  const finishedCount = room.participantes.filter((p) => p.finalizado).length;
  const totalCount = room.participantes.length;
  const allFinished = finishedCount === totalCount;

  const handleFinish = async () => {
    if (!currentParticipant || currentParticipant.finalizado || localFinalized) return;
    
    // Marcar como finalizado localmente inmediatamente
    setLocalFinalized(true);
    setFinishingStatus('finishing');
    
    try {
      const updatedRoom = await finishParticipant(currentUserId);
      
      // NO salir automáticamente - esperar a que todos finalicen
      // El ranking se mostrará cuando room.finalizado sea true (cuando todos finalicen)
      setFinishingStatus('idle');
      
      // Si todos finalizaron, mostrar el ranking
      if (updatedRoom?.finalizado) {
        setShowRanking(true);
      }
    } catch (error) {
      console.error('Error al finalizar:', error);
      // NO revertir el estado local - mantenerlo marcado
      setFinishingStatus('idle');
    }
  };

  const handleSaveRoom = async () => {
    if (!allFinished || room.finalizado) return;
    setSavingStatus('saving');
    try {
      await finishRoom();
      setSavingStatus('saved');
      // Mostrar ranking después de guardar
      setTimeout(() => {
        setShowRanking(true);
      }, 500);
    } catch (error) {
      console.error('Error al guardar la sala:', error);
      setSavingStatus('idle');
    }
  };

  // Solo mostrar ranking cuando TODOS hayan finalizado Y la sala esté marcada como finalizada
  if (showRanking || (room.finalizado && allFinished)) {
    return (
      <RankingModal
        room={room}
        currentUserId={currentUserId}
        onBackHome={() => router.push('/')}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/40 backdrop-blur-md border-b border-white/40 p-4 flex justify-between items-center">
        <Link href="/" className="text-primary hover:text-primary/80 font-medium text-sm">
          ← Salir
        </Link>
        <div className="text-center flex-1">
          <p className="text-xs text-muted-foreground">Sala</p>
          <p className="text-xl font-bold text-foreground tracking-widest">{roomId}</p>
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          {finishedCount}/{totalCount}
        </div>
      </header>

      {/* Main counter area */}
      {currentParticipant && (
        <FullScreenCounter
          participant={currentParticipant}
          onIncrement={() => updateParticipant(currentUserId, currentParticipant.piezas + 1)}
          onDecrement={() =>
            updateParticipant(currentUserId, Math.max(0, currentParticipant.piezas - 1))
          }
          participants={room.participantes}
        />
      )}

      {/* Bottom controls */}
      <div className="bg-white/40 backdrop-blur-md border-t border-white/40 p-4 space-y-3">
        {!currentParticipant?.finalizado && !localFinalized ? (
          <>
            <button
              onClick={handleFinish}
              disabled={finishingStatus !== 'idle'}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-accent-foreground font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-lg active:scale-95 transform"
            >
              {finishingStatus === 'finishing' ? 'Finalizando...' : 'Finalizar'}
            </button>
          </>
        ) : (
          <>
            <div className="bg-green-100/80 border border-green-300 rounded-2xl p-4 text-center">
              <p className="text-green-700 font-semibold">✓ Ya finalizaste</p>
            </div>
          </>
        )}

        {allFinished && !room.finalizado && (
          <div className="space-y-3">
            <div className="bg-green-100/80 border border-green-300 rounded-2xl p-3 text-center">
              <p className="text-sm font-medium text-green-700">
              ¡Todos finalizaron! Guarda la sala para ver el ranking.
            </p>
            </div>
            <button
              onClick={handleSaveRoom}
              disabled={savingStatus !== 'idle'}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-green-500 text-primary-foreground disabled:text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-lg active:scale-95 transform"
            >
              {savingStatus === 'saving' ? 'Guardando...' : savingStatus === 'saved' ? '✓ Guardado' : '💾 Guardar Sala y Ver Ranking'}
            </button>
          </div>
        )}

        {allFinished && room.finalizado && (
          <div className="bg-accent/10 border border-accent rounded-2xl p-3 text-center">
            <p className="text-sm font-medium text-accent">
              ¡Sala guardada! Mostrando ranking...
            </p>
          </div>
        )}

        {!allFinished && currentParticipant?.finalizado && (
          <div className="bg-blue-100/80 border border-blue-300 rounded-2xl p-3 text-center">
            <p className="text-xs text-blue-700">
              Esperando a los demás... ({finishedCount}/{totalCount} confirmados)
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
