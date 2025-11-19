import { MongoClient, MongoClientOptions, Collection, ObjectId } from 'mongodb';
import type { Room } from './room-types';

const dbName = process.env.MONGODB_DB || 'sushilibre';

const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function normalizeMongoUri(uri: string): string {
  // Asegurar que la URI tenga los parámetros necesarios para MongoDB Atlas
  const url = new URL(uri);
  
  // Agregar parámetros si no existen
  if (!url.searchParams.has('retryWrites')) {
    url.searchParams.set('retryWrites', 'true');
  }
  if (!url.searchParams.has('w')) {
    url.searchParams.set('w', 'majority');
  }
  
  return url.toString();
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI no está definido en las variables de entorno');
  }

  // Normalizar la URI para asegurar parámetros correctos
  const normalizedUri = normalizeMongoUri(uri);

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(normalizedUri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(normalizedUri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export interface RoomDocument extends Omit<Room, 'updatedAt'> {
  _id?: ObjectId;
  updatedAt: number;
}

export interface FinishedRoomDocument {
  _id?: ObjectId;
  roomId: string;
  participantes: Array<{
    nombre: string;
    piezas: number;
  }>;
  fecha: string;
  finishedAt: number;
}

export type RoomsCollection = Collection<RoomDocument>;
export type FinishedRoomsCollection = Collection<FinishedRoomDocument>;

export async function getRoomsCollection(): Promise<RoomsCollection> {
  const connectedClient = await getClientPromise();
  const db = connectedClient.db(dbName);
  return db.collection<RoomDocument>('rooms');
}

export async function getFinishedRoomsCollection(): Promise<FinishedRoomsCollection> {
  const connectedClient = await getClientPromise();
  const db = connectedClient.db(dbName);
  return db.collection<FinishedRoomDocument>('finished_rooms');
}

