import { NextResponse } from 'next/server';
import { getRoomFromServer, markRoomAsFinished } from '@/lib/server-room';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const room = await getRoomFromServer(params.id.toUpperCase());

  if (!room) {
    return NextResponse.json({ message: 'Sala no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ room });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { finalizado } = await request.json();

  if (typeof finalizado !== 'boolean') {
    return NextResponse.json({ message: 'Dato finalizado inválido' }, { status: 400 });
  }

  const room = await markRoomAsFinished(params.id.toUpperCase());

  if (!room) {
    return NextResponse.json({ message: 'Sala no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ room });
}

