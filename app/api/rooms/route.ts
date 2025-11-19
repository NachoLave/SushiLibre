import { NextResponse } from 'next/server';
import { createRoomOnServer } from '@/lib/server-room';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json();
  const nombre = body?.nombre?.trim();
  const userId = body?.userId;

  if (!nombre || !userId) {
    return NextResponse.json({ message: 'Faltan datos para crear la sala.' }, { status: 400 });
  }

  try {
    const room = await createRoomOnServer(nombre, userId);
    return NextResponse.json({ room });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: (error as Error).message || 'Error al crear la sala.' },
      { status: 500 }
    );
  }
}

