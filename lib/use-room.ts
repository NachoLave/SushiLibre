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
  const localFinalizedRef = useRef<Set<string>>(new Set());
  const currentParticipantIdRef = useRef<string | null>(null);

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
      
      // Actualizar desde el servidor, pero SIEMPRE preservar valores locales para el participante actual
      setRoom((prev) => {
        if (!prev) return data.room;
        
        const currentParticipantId = currentParticipantIdRef.current;
        
        // Para cada participante del servidor
        const mergedParticipants = data.room.participantes.map((serverP) => {
          const localP = prev.participantes.find((p) => p.id === serverP.id);
          if (!localP) return serverP;
          
          // Si es el participante actual, SIEMPRE preservar valores locales
          if (serverP.id === currentParticipantId) {
            const pendingValue = pendingUpdatesRef.current.get(serverP.id);
            
            // Si hay un valor pendiente, usar ese
            if (pendingValue !== undefined) {
              return { 
                ...localP, 
                piezas: pendingValue, 
                finalizado: localP.finalizado || localFinalizedRef.current.has(serverP.id)
              };
            }
            
            // SIEMPRE preservar el valor local si existe
            // Solo actualizar desde el servidor si el valor del servidor es MAYOR (otro dispositivo)
            // y la actualización local fue hace más de 5 segundos
            const lastUpdate = lastUpdateTimeRef.current.get(serverP.id) || 0;
            const timeSinceUpdate = Date.now() - lastUpdate;
            
            if (timeSinceUpdate < 5000) {
              // Actualización muy reciente, SIEMPRE usar el local
              return localP;
            }
            
            // Si el servidor tiene un valor mayor y pasó tiempo, puede ser de otro dispositivo
            // Pero aún así, preservar el local si es mayor o igual
            if (localP.piezas >= serverP.piezas) {
              return localP;
            }
            
            // Solo usar el del servidor si es significativamente mayor (puede ser de otro dispositivo)
            // Pero preservar el estado finalizado
            return {
              ...serverP,
              finalizado: localP.finalizado || localFinalizedRef.current.has(serverP.id),
              piezas: serverP.piezas > localP.piezas ? serverP.piezas : localP.piezas
            };
          }
          
          // Para otros participantes, SIEMPRE usar el valor del servidor
          // Esto permite ver actualizaciones en tiempo real de otros usuarios
          // NO preservar valores locales para otros participantes
          return serverP;
        });
        
        // SIEMPRE usar el estado finalizado del servidor (no preservar local)
        return {
          ...data.room,
          participantes: mergedParticipants,
          finalizado: data.room.finalizado, // SIEMPRE usar el del servidor
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

    // Polling cada 1.5 segundos para actualizaciones más frecuentes
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
        
        // Hacer merge preservando valores locales del participante actual
        setRoom((prev) => {
          if (!prev) return data.room;
          
          const currentParticipantId = currentParticipantIdRef.current;
          
          const mergedParticipants = data.room.participantes.map((serverP) => {
            const localP = prev.participantes.find((p) => p.id === serverP.id);
            if (!localP) return serverP;
            
            // Si es el participante actual, preservar valores locales
            if (serverP.id === currentParticipantId) {
              const pendingValue = pendingUpdatesRef.current.get(serverP.id);
              if (pendingValue !== undefined) {
                return { 
                  ...localP, 
                  piezas: pendingValue,
                  finalizado: localP.finalizado || localFinalizedRef.current.has(serverP.id)
                };
              }
              return localP;
            }
            
            // Para otros participantes, SIEMPRE usar el valor del servidor
            return serverP;
          });
          
          return {
            ...data.room,
            participantes: mergedParticipants,
            finalizado: data.room.finalizado, // SIEMPRE usar el del servidor
          };
        });
        
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
      // Guardar el ID del participante actual
      currentParticipantIdRef.current = participantId;
      
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
        // Enviar al servidor (el merge ya se hace en patchParticipant)
        const updatedRoom = await patchParticipant({ userId: participantId, piezas });
        
        if (updatedRoom) {
          // Actualizar el tiempo de última actualización después de confirmar con el servidor
          lastUpdateTimeRef.current.set(participantId, Date.now());
          // NO limpiar el valor pendiente - mantenerlo para que el polling lo respete
        }
      } catch (error) {
        console.error('Error al actualizar participante:', error);
        // NO limpiar el valor pendiente en caso de error - mantenerlo
      }
    },
    [patchParticipant]
  );

  const finishParticipant = useCallback(
    async (participantId: string) => {
      // Guardar el ID del participante actual
      currentParticipantIdRef.current = participantId;
      
      // Marcar como finalizado en la lista local (PERMANENTE)
      localFinalizedRef.current.add(participantId);
      
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
        // El merge ya se hace en patchParticipant, pero necesitamos asegurar que el estado finalizado se preserve
        const updatedRoom = await patchParticipant({ userId: participantId, finalizado: true });
        
        // Asegurar que el estado finalizado se preserve después del merge
        if (updatedRoom) {
          setRoom((prev) => {
            if (!prev) return updatedRoom;
            
            const mergedParticipants = updatedRoom.participantes.map((serverP) => {
              const localP = prev.participantes.find((p) => p.id === serverP.id);
              if (!localP) return serverP;
              
              // Para nuestro participante, SIEMPRE preservar el estado finalizado
              if (serverP.id === participantId) {
                return { ...localP, finalizado: true };
              }
              
              // Para otros participantes, usar el valor del servidor (ya viene del merge en patchParticipant)
              return serverP;
            });
            
            return {
              ...updatedRoom,
              participantes: mergedParticipants,
              finalizado: updatedRoom.finalizado, // SIEMPRE usar el del servidor
            };
          });
        }
        
        return updatedRoom;
      } catch (error) {
        console.error('Error al finalizar participante:', error);
        // NO revertir el estado optimista - mantenerlo marcado PERMANENTEMENTE
        // El estado local ya está marcado, no lo revertimos
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
