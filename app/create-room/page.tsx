'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateRoomId, saveRoom, getOrCreateUserId } from '@/lib/storage';
import Link from 'next/link';

export default function CreateRoom() {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    const roomId = generateRoomId();
    const userId = getOrCreateUserId();

    const room = {
      id: roomId,
      creador: nombre,
      participantes: [
        {
          id: userId,
          nombre: nombre,
          piezas: 0,
          finalizado: false,
        },
      ],
      finalizado: false,
      createdAt: Date.now(),
    };

    saveRoom(roomId, room);
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-8 font-medium">
          ← Volver
        </Link>

        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Crear Sala</h1>
          <p className="text-center text-muted-foreground mb-8">Eres el anfitrión de esta batalla</p>

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Tu nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan"
                className="w-full px-4 py-3 rounded-xl bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!nombre.trim() || loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-lg active:scale-95 transform"
            >
              {loading ? 'Creando...' : '✨ Crear Sala'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
