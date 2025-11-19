import { getRoomsCollection, getFinishedRoomsCollection, RoomDocument, FinishedRoomDocument } from './db';
import type { Participant, Room } from './room-types';
import { generateRoomCode } from './room-utils';

function toRoom(doc: RoomDocument): Room {
  const { _id, ...rest } = doc;
  return rest;
}

async function findRoomDocument(roomId: string) {
  const rooms = await getRoomsCollection();
  return rooms.findOne({ id: roomId });
}

export async function createRoomOnServer(nombre: string, userId: string): Promise<Room> {
  const rooms = await getRoomsCollection();
  await rooms.createIndex({ id: 1 }, { unique: true });

  const roomId = await generateUniqueRoomId();
  const now = Date.now();

  const doc: RoomDocument = {
    id: roomId,
    creador: nombre,
    participantes: [
      {
        id: userId,
        nombre,
        piezas: 0,
        finalizado: false,
      },
    ],
    finalizado: false,
    createdAt: now,
    updatedAt: now,
  };

  await rooms.insertOne(doc);
  return toRoom(doc);
}

async function generateUniqueRoomId(): Promise<string> {
  const rooms = await getRoomsCollection();
  for (let i = 0; i < 5; i++) {
    const id = generateRoomCode();
    const exists = await rooms.findOne({ id });
    if (!exists) return id;
  }
  throw new Error('No se pudo generar un código único para la sala');
}

export async function getRoomFromServer(roomId: string): Promise<Room | null> {
  const doc = await findRoomDocument(roomId);
  return doc ? toRoom(doc) : null;
}

export async function upsertParticipantInRoom(roomId: string, participant: Participant): Promise<Room | null> {
  const rooms = await getRoomsCollection();
  const doc = await findRoomDocument(roomId);

  if (!doc) {
    return null;
  }

  if (doc.finalizado) {
    throw new Error('La sala ya finalizó.');
  }

  const participants = [...doc.participantes];
  const idx = participants.findIndex((p) => p.id === participant.id);

  if (idx >= 0) {
    participants[idx] = { ...participants[idx], nombre: participant.nombre };
  } else {
    participants.push(participant);
  }

  const updatedAt = Date.now();
  await rooms.updateOne(
    { id: roomId },
    {
      $set: {
        participantes: participants,
        updatedAt,
      },
    }
  );

  return toRoom({ ...doc, participantes: participants, updatedAt });
}

export async function patchParticipantInRoom(
  roomId: string,
  payload: { userId: string; piezas?: number; finalizado?: boolean }
): Promise<Room | null> {
  const rooms = await getRoomsCollection();
  const doc = await findRoomDocument(roomId);

  if (!doc) {
    return null;
  }

  const participants = [...doc.participantes];
  const idx = participants.findIndex((p) => p.id === payload.userId);

  if (idx < 0) {
    throw new Error('Participante no encontrado en esta sala.');
  }

  const target = { ...participants[idx] };
  if (typeof payload.piezas === 'number') {
    target.piezas = payload.piezas;
  }
  if (typeof payload.finalizado === 'boolean') {
    target.finalizado = payload.finalizado;
  }
  participants[idx] = target;

  const allFinished = participants.length > 0 && participants.every((p) => p.finalizado);
  const finalizado = allFinished ? true : doc.finalizado;
  const updatedAt = Date.now();

  await rooms.updateOne(
    { id: roomId },
    {
      $set: {
        participantes,
        finalizado,
        updatedAt,
      },
    }
  );

  // Si todos finalizaron, guardar automáticamente en finished_rooms
  if (allFinished && !doc.finalizado) {
    const finishedRooms = await getFinishedRoomsCollection();
    const finishedAt = Date.now();
    const fecha = new Date().toLocaleDateString('es-ES');
    
    // Verificar si ya existe para evitar duplicados
    const existing = await finishedRooms.findOne({ roomId });
    if (!existing) {
      const finishedDoc: FinishedRoomDocument = {
        roomId: doc.id,
        participantes: participants.map((p) => ({
          nombre: p.nombre,
          piezas: p.piezas,
        })),
        fecha,
        finishedAt,
      };
      await finishedRooms.insertOne(finishedDoc);
    }
  }

  return toRoom({ ...doc, participantes, finalizado, updatedAt });
}

export async function markRoomAsFinished(roomId: string): Promise<Room | null> {
  const rooms = await getRoomsCollection();
  const doc = await findRoomDocument(roomId);

  if (!doc) {
    return null;
  }

  if (doc.finalizado) {
    return toRoom(doc);
  }

  const updatedAt = Date.now();
  await rooms.updateOne(
    { id: roomId },
    {
      $set: {
        finalizado: true,
        updatedAt,
      },
    }
  );

  // Guardar en finished_rooms automáticamente
  const finishedRooms = await getFinishedRoomsCollection();
  const finishedAt = Date.now();
  const fecha = new Date().toLocaleDateString('es-ES');
  
  // Verificar si ya existe para evitar duplicados
  const existing = await finishedRooms.findOne({ roomId });
  if (!existing) {
    const finishedDoc: FinishedRoomDocument = {
      roomId: doc.id,
      participantes: doc.participantes.map((p) => ({
        nombre: p.nombre,
        piezas: p.piezas,
      })),
      fecha,
      finishedAt,
    };
    await finishedRooms.insertOne(finishedDoc);
  }

  return toRoom({ ...doc, finalizado: true, updatedAt });
}

