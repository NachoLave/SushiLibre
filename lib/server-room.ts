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

  // Si la sala ya está finalizada, no permitir actualizaciones (excepto si es para ver el estado)
  if (doc.finalizado && typeof payload.piezas === 'number') {
    throw new Error('La sala ya finalizó. No se pueden actualizar contadores.');
  }

  const participants = [...doc.participantes];
  const idx = participants.findIndex((p) => p.id === payload.userId);

  if (idx < 0) {
    // Si el participante no existe, intentar agregarlo con valores por defecto
    // Esto puede pasar si hay un desincronización entre cliente y servidor
    console.warn(`Participante ${payload.userId} no encontrado en sala ${roomId}, agregándolo...`);
    participants.push({
      id: payload.userId,
      nombre: `Usuario ${payload.userId.slice(0, 4)}`,
      piezas: typeof payload.piezas === 'number' ? payload.piezas : 0,
      finalizado: payload.finalizado || false,
    });
  } else {
    const target = { ...participants[idx] };
    if (typeof payload.piezas === 'number') {
      target.piezas = payload.piezas;
    }
    if (typeof payload.finalizado === 'boolean') {
      target.finalizado = payload.finalizado;
    }
    participants[idx] = target;
  }

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

  // NO guardar automáticamente en finished_rooms - solo se guarda cuando se llama explícitamente a markRoomAsFinished

  return toRoom({ ...doc, participantes, finalizado, updatedAt });
}

export async function markRoomAsFinished(roomId: string): Promise<Room | null> {
  const rooms = await getRoomsCollection();
  const doc = await findRoomDocument(roomId);

  if (!doc) {
    return null;
  }

  if (doc.finalizado) {
    // Si ya está finalizado, verificar si ya está guardado en finished_rooms
    const finishedRooms = await getFinishedRoomsCollection();
    const existing = await finishedRooms.findOne({ roomId });
    if (!existing) {
      // Si no está guardado, guardarlo ahora
      const finishedAt = Date.now();
      const fecha = new Date().toLocaleDateString('es-ES');
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

  // Guardar en finished_rooms SOLO cuando se llama explícitamente a esta función
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

