'use client';

import { useEffect, useState } from 'react';
import { getUserHistory } from '@/lib/storage';
import Link from 'next/link';

interface SessionData {
  idSala: string;
  fecha: string;
  participantes: { nombre: string; piezas: number }[];
  tuPuntaje: number;
  tuNombre: string;
}

interface FinishedRoom {
  roomId: string;
  fecha: string;
  participantes: { nombre: string; piezas: number }[];
}

export default function History() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [finishedRooms, setFinishedRooms] = useState<FinishedRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<FinishedRoom | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [stats, setStats] = useState({
    record: 0,
    promedio: 0,
    totalSesiones: 0,
  });

  useEffect(() => {
    const history = getUserHistory();
    setSessions([...history.sessions].reverse());

    if (history.sessions.length > 0) {
      const totalPiezas = history.sessions.reduce((sum, s) => sum + s.tuPuntaje, 0);
      setStats({
        record: history.record,
        promedio: Math.round(totalPiezas / history.sessions.length),
        totalSesiones: history.sessions.length,
      });
    }

    // Cargar todas las salas finalizadas de MongoDB
    const loadFinishedRooms = async () => {
      try {
        setLoadingRooms(true);
        const response = await fetch('/api/finished-rooms');
        if (response.ok) {
          const data = await response.json();
          setFinishedRooms(data.rooms || []);
        }
      } catch (error) {
        console.error('Error al cargar salas finalizadas:', error);
      } finally {
        setLoadingRooms(false);
      }
    };

    loadFinishedRooms();
  }, []);

  const handleSearch = async (roomId?: string) => {
    const idToSearch = roomId || searchId.trim().toUpperCase();
    if (!idToSearch) return;

    setSearchId(idToSearch);
    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const response = await fetch(`/api/finished-rooms/${idToSearch}`);
      if (!response.ok) {
        if (response.status === 404) {
          setSearchError('Sala no encontrada. Verifica el código.');
        } else {
          setSearchError('Error al buscar la sala.');
        }
        setSearching(false);
        return;
      }

      const data = await response.json();
      setSearchResult(data.room);
    } catch (error) {
      setSearchError('Error al buscar la sala.');
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex flex-col p-4">
      <div className="max-w-2xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-8 font-medium">
          ← Volver
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-8">Tu Historial</h1>

        {/* Búsqueda por ID de sala */}
        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Buscar Sala por ID</h2>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Código de Sala</label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                maxLength={8}
                className="w-full px-4 py-3 rounded-xl bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-center text-xl tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={!searchId.trim() || searching}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              {searching ? 'Buscando...' : '🔍 Buscar'}
            </button>
          </form>

          {searchError && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
              {searchError}
            </div>
          )}

          {searchResult && (
            <div className="mt-4 bg-accent/10 border border-accent/30 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Sala {searchResult.roomId}</h3>
                  <p className="text-sm text-muted-foreground">{searchResult.fecha}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border/50 pt-4">
                <p className="text-sm font-medium text-foreground mb-2">Ranking Final:</p>
                {[...searchResult.participantes]
                  .sort((a, b) => b.piezas - a.piezas)
                  .map((p, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎯'} {p.nombre}
                      </span>
                      <span className="font-medium text-foreground">{p.piezas} piezas</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Salas Finalizadas de MongoDB */}
        <h2 className="text-2xl font-bold text-foreground mb-4">Partidas Guardadas</h2>
        
        {loadingRooms ? (
          <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">Cargando partidas...</p>
          </div>
        ) : finishedRooms.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-8 text-center">
            <p className="text-lg text-muted-foreground mb-4">📊 No hay partidas guardadas</p>
            <Link href="/create-room" className="text-primary hover:text-primary/80 font-medium">
              ¡Crea una nueva batalla!
            </Link>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {finishedRooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() => handleSearch(room.roomId)}
                className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4 text-left hover:bg-white/80 transition-all duration-200 hover:shadow-lg active:scale-98"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{room.roomId}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {room.participantes.length} participante{room.participantes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {Math.max(...room.participantes.map(p => p.piezas))}
                    </p>
                    <p className="text-xs text-muted-foreground">{room.fecha}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
