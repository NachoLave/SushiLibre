'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateUserId } from '@/lib/storage';
import Link from 'next/link';

export default function JoinRoom() {
  const [roomId, setRoomId] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRoomId = roomId.trim().toUpperCase();
    if (!nombre.trim() || !trimmedRoomId) return;

    setLoading(true);
    setError('');

    const userId = getOrCreateUserId();

    try {
      const response = await fetch(`/api/rooms/${trimmedRoomId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nombre: nombre.trim(),
        }),
      });

      if (response.status === 404) {
        throw new Error('Sala no encontrada. Verifica el código.');
      }

      if (!response.ok) {
        const { message } = await response.json().catch(() => ({ message: 'Error al unirse.' }));
        throw new Error(message || 'No se pudo unir a la sala.');
      }

      router.push(`/room/${trimmedRoomId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-8 font-medium">
          ← Volver
        </Link>

        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Unirse a Sala</h1>
          <p className="text-center text-muted-foreground mb-8">Pide el código a tus amigos</p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Código de Sala</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                maxLength={8}
                className="w-full px-4 py-3 rounded-xl bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-center text-2xl tracking-widest"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Tu nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: María"
                className="w-full px-4 py-3 rounded-xl bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!nombre.trim() || !roomId.trim() || loading}
              className="w-full bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-secondary-foreground font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-lg active:scale-95 transform"
            >
              {loading ? 'Uniéndose...' : '👥 Unirse'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
