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

  const lastUpdateTimeRef = useRef<Map<string, number>>(new Map());

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
      
      // Actualizar desde el servidor, pero preservar valores locales recientes
      setRoom((prev) => {
        if (!prev) return data.room;
        
        // Para cada participante, si hay una actualización local reciente (últimos 2 segundos),
        // preservar el valor local, de lo contrario usar el del servidor
        const mergedParticipants = data.room.participantes.map((serverP) => {
          const localP = prev.participantes.find((p) => p.id === serverP.id);
          if (!localP) return serverP;
          
          const lastUpdate = lastUpdateTimeRef.current.get(serverP.id) || 0;
          const timeSinceUpdate = Date.now() - lastUpdate;
          
          // Si la actualización local fue hace menos de 2 segundos, usar el valor local
          if (timeSinceUpdate < 2000 && localP.piezas !== serverP.piezas) {
            return localP;
          }
          
          // De lo contrario, usar el valor del servidor (puede tener actualizaciones de otros usuarios)
          return serverP;
        });
        
        return {
          ...data.room,
          participantes: mergedParticipants,
        };
      });
      
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
      // Marcar el tiempo de actualización local
      lastUpdateTimeRef.current.set(participantId, Date.now());
      
      // Optimistic update - actualizar inmediatamente en el estado local
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

      // Enviar al servidor
      const updatedRoom = await patchParticipant({ userId: participantId, piezas });
      
      // Confirmar con los datos del servidor (puede tener actualizaciones de otros participantes)
      if (updatedRoom) {
        setRoom(updatedRoom);
        // Actualizar el tiempo de última actualización después de confirmar con el servidor
        lastUpdateTimeRef.current.set(participantId, Date.now());
      }
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
