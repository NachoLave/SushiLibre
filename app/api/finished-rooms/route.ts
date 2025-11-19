import { NextResponse } from 'next/server';
import { getFinishedRoomsCollection } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const finishedRooms = await getFinishedRoomsCollection();
    
    // Obtener todas las salas finalizadas, ordenadas por fecha más reciente primero
    const allRooms = await finishedRooms
      .find({})
      .sort({ finishedAt: -1 })
      .toArray();
    
    // Formatear los datos para el frontend
    const rooms = allRooms.map((room) => {
      const { _id, ...roomData } = room;
      return roomData;
    });
    
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error al obtener salas finalizadas:', error);
    return NextResponse.json(
      { message: 'Error al obtener las salas finalizadas', error: String(error) },
      { status: 500 }
    );
  }
}

