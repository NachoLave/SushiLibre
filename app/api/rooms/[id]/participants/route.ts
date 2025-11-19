import { NextResponse } from 'next/server';
import {
  getRoomFromServer,
  upsertParticipantInRoom,
  patchParticipantInRoom,
} from '@/lib/server-room';
import type { Participant } from '@/lib/room-types';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roomId = id.toUpperCase();
  const body = await request.json();
  const userId = body?.userId;
  const nombre = body?.nombre?.trim();

  if (!userId || !nombre) {
    return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 });
  }

  const room = await getRoomFromServer(roomId);
  if (!room) {
    return NextResponse.json({ message: 'Sala no encontrada' }, { status: 404 });
  }
  if (room.finalizado) {
    return NextResponse.json({ message: 'La sala ya finalizó' }, { status: 409 });
  }

  const participant: Participant = {
    id: userId,
    nombre,
    piezas: 0,
    finalizado: false,
  };

  try {
    const updatedRoom = await upsertParticipantInRoom(roomId, participant);
    if (!updatedRoom) {
      return NextResponse.json({ message: 'Sala no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || 'Error al unirse.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roomId = id.toUpperCase();
  const body = await request.json();
  const { userId, piezas, finalizado } = body;

  if (!userId) {
    return NextResponse.json({ message: 'userId requerido' }, { status: 400 });
  }

  if (typeof piezas !== 'number' && typeof finalizado !== 'boolean') {
    return NextResponse.json({ message: 'Nada que actualizar' }, { status: 400 });
  }

  try {
    const updatedRoom = await patchParticipantInRoom(roomId, {
      userId,
      piezas,
      finalizado,
    });

    if (!updatedRoom) {
      return NextResponse.json({ message: 'Sala no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error('Error en PATCH /api/rooms/[id]/participants:', {
      roomId,
      userId,
      piezas,
      finalizado,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Error al actualizar participante.',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

