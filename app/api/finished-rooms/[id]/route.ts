import { NextResponse } from 'next/server';
import { getFinishedRoomsCollection, getRoomsCollection } from '@/lib/db';
import { getRoomFromServer } from '@/lib/server-room';

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
      // Si no está en finished_rooms, buscar en rooms para ver si está finalizada
      // Si está finalizada, guardarla automáticamente en finished_rooms
      const room = await getRoomFromServer(roomId);
      
      if (room && room.finalizado) {
        // La sala está finalizada pero no está guardada en finished_rooms
        // Guardarla automáticamente ahora
        const finishedAt = Date.now();
        const fecha = new Date().toLocaleDateString('es-ES');
        const finishedDoc = {
          roomId: room.id,
          participantes: room.participantes.map((p) => ({
            nombre: p.nombre,
            piezas: p.piezas,
          })),
          fecha,
          finishedAt,
        };
        
        await finishedRooms.insertOne(finishedDoc);
        
        // Retornar la sala guardada
        return NextResponse.json({ room: finishedDoc });
      }
      
      // Intentar buscar sin importar mayúsculas/minúsculas como fallback
      const allRooms = await finishedRooms.find({}).toArray();
      const foundRoom = allRooms.find(r => r.roomId?.toUpperCase() === roomId);
      
      if (foundRoom) {
        const { _id, ...roomData } = foundRoom;
        return NextResponse.json({ room: roomData });
      }
      
      // Log para debugging
      console.log(`Sala ${roomId} no encontrada en finished_rooms. Total de salas: ${allRooms.length}`);
      return NextResponse.json({ message: 'Sala no encontrada. Verifica que la sala haya sido finalizada.' }, { status: 404 });
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

