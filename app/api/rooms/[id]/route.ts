import { NextResponse } from 'next/server';
import { getRoomFromServer, markRoomAsFinished } from '@/lib/server-room';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await getRoomFromServer(id.toUpperCase());

    if (!room) {
      return NextResponse.json({ message: 'Sala no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error en GET /api/rooms/[id]:', error);
    return NextResponse.json(
      { message: 'Error al obtener la sala', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { finalizado } = await request.json();

    if (typeof finalizado !== 'boolean') {
      return NextResponse.json({ message: 'Dato finalizado inválido' }, { status: 400 });
    }

    const room = await markRoomAsFinished(id.toUpperCase());

    if (!room) {
      return NextResponse.json({ message: 'Sala no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error en PATCH /api/rooms/[id]:', error);
    return NextResponse.json(
      { message: 'Error al actualizar la sala', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

