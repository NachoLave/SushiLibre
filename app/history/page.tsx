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

export default function History() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
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
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex flex-col p-4">
      <div className="max-w-2xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-8 font-medium">
          ← Volver
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-8">Tu Historial</h1>

        {stats.totalSesiones > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Récord</p>
              <p className="text-3xl font-bold text-primary">{stats.record}</p>
            </div>
            <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Promedio</p>
              <p className="text-3xl font-bold text-secondary">{stats.promedio}</p>
            </div>
            <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Sesiones</p>
              <p className="text-3xl font-bold text-accent">{stats.totalSesiones}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-8 text-center">
              <p className="text-lg text-muted-foreground mb-4">📊 No hay sesiones guardadas</p>
              <Link href="/create-room" className="text-primary hover:text-primary/80 font-medium">
                ¡Crea una nueva batalla!
              </Link>
            </div>
          ) : (
            sessions.map((session, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{session.tuNombre}</h3>
                    <p className="text-sm text-muted-foreground">{session.fecha}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{session.tuPuntaje}</p>
                    <p className="text-xs text-muted-foreground">piezas</p>
                  </div>
                </div>

                {/* Ranking preview */}
                <div className="space-y-2 border-t border-border/50 pt-4">
                  {session.participantes.slice(0, 3).map((p, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {p.nombre}
                      </span>
                      <span className="font-medium text-foreground">{p.piezas}</span>
                    </div>
                  ))}
                  {session.participantes.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{session.participantes.length - 3} más...
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
