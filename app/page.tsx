'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserHistory } from '@/lib/storage';
import AnimatedSushi from '@/components/animated-sushi';

export default function Home() {
  const [record, setRecord] = useState<number | null>(null);

  useEffect(() => {
    const history = getUserHistory();
    if (history.record > 0) {
      setRecord(history.record);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-2 tracking-tight font-serif">
            Sushi Score
          </h1>
          <div className="h-1 w-16 bg-primary rounded-full mx-auto mb-4"></div>
          <p className="text-base text-muted-foreground font-medium">
            El contador definitivo para sushi libre
          </p>
        </div>

        <div className="mb-12">
          <AnimatedSushi />
        </div>

        {record !== null && (
          <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl p-8 mb-12 shadow-lg w-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Tu Récord Personal</p>
              <p className="text-6xl font-bold text-primary mb-2">{record}</p>
              <p className="text-sm text-muted-foreground">piezas de sushi</p>
            </div>
          </div>
        )}

        <div className="space-y-3 w-full mb-8">
          <Link href="/create-room" className="block">
            <button className="w-full bg-primary/90 backdrop-blur-sm hover:bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-xl active:scale-95 transform border border-white/30">
              Crear Sala
            </button>
          </Link>

          <Link href="/join-room" className="block">
            <button className="w-full bg-secondary/90 backdrop-blur-sm hover:bg-secondary text-secondary-foreground font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-xl active:scale-95 transform border border-white/30">
              Unirse a Sala
            </button>
          </Link>

          <Link href="/history" className="block">
            <button className="w-full bg-accent/90 backdrop-blur-sm hover:bg-accent text-accent-foreground font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-xl active:scale-95 transform border border-white/30">
              Ver Historial
            </button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>Comparte y disfruta con tus amigos</p>
        </div>
      </div>
    </main>
  );
}
