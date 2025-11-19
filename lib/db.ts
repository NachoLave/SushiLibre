import { MongoClient, MongoClientOptions, Collection, ObjectId } from 'mongodb';
import type { Room } from './room-types';

const dbName = process.env.MONGODB_DB || 'sushilibre';

const options: MongoClientOptions = {
  maxPoolSize: 10,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI no está definido en las variables de entorno');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, options);
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

