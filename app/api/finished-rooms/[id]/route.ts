import { NextResponse } from 'next/server';
import { getFinishedRoomsCollection } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roomId = id.toUpperCase();
    
    const finishedRooms = await getFinishedRoomsCollection();
    const finishedRoom = await finishedRooms.findOne({ roomId });

    if (!finishedRoom) {
      return NextResponse.json({ message: 'Sala no encontrada en el historial' }, { status: 404 });
    }

    // Remover _id del objeto antes de enviarlo
    const { _id, ...roomData } = finishedRoom;
    return NextResponse.json({ room: roomData });
  } catch (error) {
    console.error('Error en GET /api/finished-rooms/[id]:', error);
    return NextResponse.json(
      { message: 'Error al buscar la sala', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

