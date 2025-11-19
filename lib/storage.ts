interface SessionData {
  idSala: string;
  fecha: string;
  participantes: { nombre: string; piezas: number }[];
  tuPuntaje: number;
  tuNombre: string;
}

interface UserHistory {
  sessions: SessionData[];
  record: number;
}

export function getOrCreateUserId(): string {
  let userId = localStorage.getItem('sushi_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sushi_user_id', userId);
  }
  return userId;
}

export function saveSession(session: SessionData): void {
  const history = getUserHistory();
  history.sessions.push(session);
  history.record = Math.max(history.record, session.tuPuntaje);
  localStorage.setItem('sushi_history', JSON.stringify(history));
}

export function getUserHistory(): UserHistory {
  const stored = localStorage.getItem('sushi_history');
  if (!stored) {
    return { sessions: [], record: 0 };
  }
  return JSON.parse(stored);
}

