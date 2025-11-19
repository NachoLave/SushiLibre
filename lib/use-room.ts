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
  const pendingUpdatesRef = useRef<Map<string, number>>(new Map());

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
      
      // Actualizar desde el servidor, pero preservar valores locales recientes solo para el participante actual
      setRoom((prev) => {
        if (!prev) return data.room;
        
        // Obtener el ID del participante actual (el que tiene actualizaciones recientes)
        const currentParticipantId = Array.from(lastUpdateTimeRef.current.keys()).find(
          (id) => {
            const lastUpdate = lastUpdateTimeRef.current.get(id) || 0;
            return Date.now() - lastUpdate < 5000;
          }
        );
        
        // Para cada participante del servidor
        const mergedParticipants = data.room.participantes.map((serverP) => {
          const localP = prev.participantes.find((p) => p.id === serverP.id);
          if (!localP) return serverP;
          
          // Si es el participante actual, preservar valores locales recientes
          if (serverP.id === currentParticipantId) {
            const lastUpdate = lastUpdateTimeRef.current.get(serverP.id) || 0;
            const pendingValue = pendingUpdatesRef.current.get(serverP.id);
            const timeSinceUpdate = Date.now() - lastUpdate;
            
            // Si hay un valor pendiente, usar ese
            if (pendingValue !== undefined) {
              return { ...localP, piezas: pendingValue };
            }
            
            // Si la actualización local fue hace menos de 3 segundos y el valor local es mayor o igual,
            // preservar el valor local
            if (timeSinceUpdate < 3000 && localP.piezas >= serverP.piezas) {
              return localP;
            }
          }
          
          // Para otros participantes (o si el valor del servidor es más reciente),
          // SIEMPRE usar el valor del servidor para ver actualizaciones de otros usuarios
          // Pero preservar el estado finalizado si está marcado localmente
          const merged = { ...serverP };
          if (localP.finalizado && !serverP.finalizado) {
            merged.finalizado = true;
          }
          
          return merged;
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
      // Marcar el tiempo de actualización local y el valor pendiente
      const updateTime = Date.now();
      lastUpdateTimeRef.current.set(participantId, updateTime);
      pendingUpdatesRef.current.set(participantId, piezas);
      
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

      try {
        // Enviar al servidor
        const updatedRoom = await patchParticipant({ userId: participantId, piezas });
        
        // Confirmar con los datos del servidor (puede tener actualizaciones de otros participantes)
        if (updatedRoom) {
          // Limpiar el valor pendiente ya que se confirmó
          pendingUpdatesRef.current.delete(participantId);
          
          // Actualizar el estado con los datos del servidor, pero preservar nuestro valor si es más reciente
          setRoom((prev) => {
            if (!prev) return updatedRoom;
            
            const mergedParticipants = updatedRoom.participantes.map((serverP) => {
              const localP = prev.participantes.find((p) => p.id === serverP.id);
              if (!localP) return serverP;
              
              // Si es nuestro participante y nuestro valor es más reciente, preservarlo
              if (serverP.id === participantId) {
                const lastUpdate = lastUpdateTimeRef.current.get(participantId) || 0;
                const timeSinceUpdate = Date.now() - lastUpdate;
                if (timeSinceUpdate < 1000 && localP.piezas === piezas) {
                  return localP;
                }
              }
              
              // Para otros participantes, usar el valor del servidor (puede tener actualizaciones)
              return serverP;
            });
            
            return {
              ...updatedRoom,
              participantes: mergedParticipants,
            };
          });
          
          // Actualizar el tiempo de última actualización después de confirmar con el servidor
          lastUpdateTimeRef.current.set(participantId, Date.now());
        }
      } catch (error) {
        // Si falla, limpiar el valor pendiente y dejar que el polling restaure el estado
        pendingUpdatesRef.current.delete(participantId);
        console.error('Error al actualizar participante:', error);
      }
    },
    [patchParticipant]
  );

  const finishParticipant = useCallback(
    async (participantId: string) => {
      // Optimistic update - marcar como finalizado inmediatamente
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

      try {
        const updatedRoom = await patchParticipant({ userId: participantId, finalizado: true });
        
        // Confirmar con los datos del servidor, pero preservar el estado finalizado si está marcado localmente
        if (updatedRoom) {
          setRoom((prev) => {
            if (!prev) return updatedRoom;
            
            const mergedParticipants = updatedRoom.participantes.map((serverP) => {
              const localP = prev.participantes.find((p) => p.id === serverP.id);
              if (!localP) return serverP;
              
              // Preservar el estado finalizado si está marcado localmente
              if (serverP.id === participantId && localP.finalizado) {
                return localP;
              }
              
              return serverP;
            });
            
            return {
              ...updatedRoom,
              participantes: mergedParticipants,
            };
          });
        }
        
        return updatedRoom;
      } catch (error) {
        console.error('Error al finalizar participante:', error);
        // Si falla, revertir el estado optimista
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                participantes: prev.participantes.map((p) =>
                  p.id === participantId ? { ...p, finalizado: false } : p
                ),
              }
            : prev
        );
        return null;
      }
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
