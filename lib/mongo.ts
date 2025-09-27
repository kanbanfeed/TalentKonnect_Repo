import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI || '', {
  useUnifiedTopology: true,  // Keep this option for the best experience with MongoDB clusters
});

export async function connectToDatabase() {
  if (!client.isConnected()) {
    await client.connect();
  }
  const db = client.db();
  return { db, client };
}
