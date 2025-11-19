import { NextResponse } from 'next/server';
import { getFinishedRoomsCollection } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roomId = id.toUpperCase().trim();
    
    if (!roomId || roomId.length === 0) {
      return NextResponse.json({ message: 'Código de sala inválido' }, { status: 400 });
    }
    
    const finishedRooms = await getFinishedRoomsCollection();
    
    // Buscar por roomId (ya está en mayúsculas)
    const finishedRoom = await finishedRooms.findOne({ roomId });

    if (!finishedRoom) {
      // Intentar buscar sin importar mayúsculas/minúsculas como fallback
      const allRooms = await finishedRooms.find({}).toArray();
      const foundRoom = allRooms.find(r => r.roomId?.toUpperCase() === roomId);
      
      if (foundRoom) {
        const { _id, ...roomData } = foundRoom;
        return NextResponse.json({ room: roomData });
      }
      
      // Log para debugging
      console.log(`Sala ${roomId} no encontrada en finished_rooms. Total de salas: ${allRooms.length}`);
      return NextResponse.json({ message: 'Sala no encontrada en el historial. Verifica que la sala haya sido finalizada y guardada.' }, { status: 404 });
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

