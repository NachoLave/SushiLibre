'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveRoom, getRoom } from '@/lib/storage';

export interface Participant {
  id: string;
  nombre: string;
  piezas: number;
  finalizado: boolean;
}

export interface Room {
  id: string;
  creador: string;
  participantes: Participant[];
  finalizado: boolean;
  createdAt: number;
}

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  const sanitizeRoom = useCallback((data: Room | null) => {
    if (!data) return null;

    const seenIds = new Set<string>();
    let modified = false;
    const uniqueParticipants = data.participantes.filter((participant) => {
      if (seenIds.has(participant.id)) {
        modified = true;
        return false;
      }
      seenIds.add(participant.id);
      return true;
    });

    if (!modified) {
      return data;
    }

    const sanitized = { ...data, participantes: uniqueParticipants };
    saveRoom(data.id, sanitized);
    return sanitized;
  }, []);

  useEffect(() => {
    const storedRoom = sanitizeRoom(getRoom(roomId));
    if (storedRoom) {
      setRoom(storedRoom);
    }
    setLoading(false);

    const interval = setInterval(() => {
      const updated = sanitizeRoom(getRoom(roomId));
      if (updated) {
        setRoom(updated);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [roomId, sanitizeRoom]);

  const updateParticipant = useCallback(
    (participantId: string, piezas: number) => {
      if (room) {
        const updated = {
          ...room,
          participantes: room.participantes.map((p) =>
            p.id === participantId ? { ...p, piezas } : p
          ),
        };
        setRoom(updated);
        saveRoom(roomId, updated);
      }
    },
    [room, roomId]
  );

  const finishParticipant = useCallback(
    (participantId: string) => {
      if (room) {
        const updated = {
          ...room,
          participantes: room.participantes.map((p) =>
            p.id === participantId ? { ...p, finalizado: true } : p
          ),
        };
        setRoom(updated);
        saveRoom(roomId, updated);
      }
    },
    [room, roomId]
  );

  const finishRoom = useCallback(() => {
    if (room) {
      const updated = { ...room, finalizado: true };
      setRoom(updated);
      saveRoom(roomId, updated);
    }
  }, [room, roomId]);

  return { room, loading, updateParticipant, finishParticipant, finishRoom };
}
