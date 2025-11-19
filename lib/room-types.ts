export interface Participant {
  id: string;
  nombre: string;
  piezas: number;
  finalizado: boolean;
}

export interface Room {
  id: string;
  creador: string;
  participantes: Participant[];
  finalizado: boolean;
  createdAt: number;
  updatedAt?: number;
}

