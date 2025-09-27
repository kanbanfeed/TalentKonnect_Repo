import { connectToDatabase } from '../lib/mongo'; // MongoDB connection

type RaffleState = {
  tickets: Record<string, number>;
  users: Record<string, { id: string; email?: string; credits?: number }>;
  raffle: { lastWinner?: any; history: any[] };
  newsletter: string[];
};

const isProduction = process.env.NODE_ENV === 'production';

let g: any;

if (!isProduction) {
  // In-memory store for local/dev environment
  g = globalThis;
  g.__MEMO_DB__ ||= { tickets: {}, users: {}, raffle: { history: [] }, newsletter: [] } as RaffleState;
} else {
  // MongoDB store for production
  g = { __DB__: null }; // Placeholder to hold MongoDB connection
}

export async function db(): Promise<RaffleState> {
  if (isProduction && !g.__DB__) {
    const { db: mongoDb } = await connectToDatabase();
    g.__DB__ = mongoDb.collection('raffle'); // Collection for storing raffle data
  }

  if (isProduction && g.__DB__) {
    const mongoDb = g.__DB__;
    // Fetch data from MongoDB
    const raffleData = await mongoDb.findOne({ name: 'raffle_state' });

    if (raffleData) {
      return raffleData.state as RaffleState; // Return stored raffle state from MongoDB
    } else {
      // If no data, return empty default state
      return { tickets: {}, users: {}, raffle: { history: [] }, newsletter: [] };
    }
  } else {
    // Use in-memory state for development/local environment
    return g.__MEMO_DB__ as RaffleState;
  }
}

export async function saveToDb(state: RaffleState): Promise<void> {
  if (isProduction && g.__DB__) {
    const mongoDb = g.__DB__;
    await mongoDb.updateOne(
      { name: 'raffle_state' },
      { $set: { state } },
      { upsert: true } // Create a new record if it doesn't exist
    );
  } else {
    // Save to in-memory store for local/dev environment
    g.__MEMO_DB__ = state;
  }
}
