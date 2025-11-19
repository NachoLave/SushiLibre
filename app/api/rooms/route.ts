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
    console.error('Error en POST /api/rooms:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    // Si es un error de conexión MongoDB, dar un mensaje más claro
    if (errorName.includes('Mongo') || errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
      console.error('Error de conexión MongoDB:', {
        name: errorName,
        message: errorMessage,
        hasUri: !!process.env.MONGODB_URI,
        uriPrefix: process.env.MONGODB_URI?.substring(0, 20),
      });
      return NextResponse.json(
        { 
          message: 'Error de conexión con la base de datos. Verifica las variables de entorno MONGODB_URI y MONGODB_DB.',
          error: errorMessage 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: errorMessage || 'Error al crear la sala.' },
      { status: 500 }
    );
  }
}

