'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Participant, Room } from '@/lib/room-types';

interface ApiRoomResponse {
  room: Room;
}

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    const normalizedRoomId = roomId.toUpperCase();

    try {
      const response = await fetch(`/api/rooms/${normalizedRoomId}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Sala no encontrada');
      }

      const data: ApiRoomResponse = await response.json();
      setRoom(data.room);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
    pollRef.current && clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
      fetchRoom();
    }, 1500);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchRoom]);

  const patchParticipant = useCallback(
    async (payload: Partial<Participant> & { userId: string }) => {
      if (!roomId) return null;
      const normalizedRoomId = roomId.toUpperCase();
      try {
        const response = await fetch(`/api/rooms/${normalizedRoomId}/participants`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('No se pudo actualizar la sala');
        }

        const data: ApiRoomResponse = await response.json();
        setRoom(data.room);
        return data.room;
      } catch (err) {
        console.error(err);
        fetchRoom();
        return null;
      }
    },
    [roomId, fetchRoom]
  );

  const updateParticipant = useCallback(
    async (participantId: string, piezas: number) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              participantes: prev.participantes.map((p) =>
                p.id === participantId ? { ...p, piezas } : p
              ),
            }
          : prev
      );

      await patchParticipant({ userId: participantId, piezas });
    },
    [patchParticipant]
  );

  const finishParticipant = useCallback(
    async (participantId: string) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              participantes: prev.participantes.map((p) =>
                p.id === participantId ? { ...p, finalizado: true } : p
              ),
            }
          : prev
      );

      return patchParticipant({ userId: participantId, finalizado: true });
    },
    [patchParticipant]
  );

  const finishRoom = useCallback(async () => {
    if (!roomId) return;
    const normalizedRoomId = roomId.toUpperCase();

    try {
      const response = await fetch(`/api/rooms/${normalizedRoomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalizado: true }),
      });

      if (!response.ok) {
        throw new Error('No se pudo finalizar la sala');
      }

      const data: ApiRoomResponse = await response.json();
      setRoom(data.room);
    } catch (err) {
      console.error(err);
      fetchRoom();
    }
  }, [roomId, fetchRoom]);

  return { room, loading, error, updateParticipant, finishParticipant, finishRoom };
}
