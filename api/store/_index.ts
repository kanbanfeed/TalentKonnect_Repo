import { connectToDatabase } from "../../lib/mongo"; // MongoDB connection

export type User = { id: string; name?: string; tickets: number };
interface Store {
  upsertUser(id: string, name?: string): Promise<User | undefined>;
  addTickets(id: string, n?: number): Promise<number>;
  getTickets(id: string): Promise<number>;
  leaderboard(): Promise<User[]>;
  totalTickets(): Promise<number>;
  pickWinner(): Promise<User | null>;
  bumpVersion(): Promise<void>;
  getVersion(): Promise<number>;
  addNewsletter(email: string): Promise<void>;
}

class MongoStore implements Store {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  private key(s: string) {
    return String(s || "").trim().toLowerCase();
  }

  async upsertUser(id: string, name?: string) {
    const userId = this.key(id);
    if (!userId) return;
    const user = await this.db.collection("users").findOne({ id: userId });
    if (user) {
      if (name) user.name = name;
      await this.db.collection("users").updateOne({ id: userId }, { $set: user });
      return user;
    }
    const newUser: User = { id: userId, name, tickets: 0 };
    await this.db.collection("users").insertOne(newUser);
    return newUser;
  }

  async addTickets(id: string, n = 1) {
    const userId = this.key(id);
    if (!userId) return 0;
    const user = await this.upsertUser(userId);
    if (!user) return 0;
    user.tickets += Number(n);
    await this.db.collection("users").updateOne({ id: userId }, { $set: user });
    return user.tickets;
  }

  async getTickets(id: string) {
    const user = await this.db.collection("users").findOne({ id: this.key(id) });
    return user?.tickets || 0;
  }

  async leaderboard() {
    const users = await this.db.collection("users").find({}).sort({ tickets: -1 }).toArray();
    return users;
  }

  async totalTickets() {
    const users = await this.leaderboard();
    return users.reduce((sum, user) => sum + user.tickets, 0);
  }

  async pickWinner() {
    const leaderboard = await this.leaderboard();
    const totalTickets = await this.totalTickets();
    if (!totalTickets) return null;

    let random = Math.floor(Math.random() * totalTickets) + 1;
    for (const user of leaderboard) {
      random -= user.tickets;
      if (random <= 0) return user;
    }
    return null;
  }

  async bumpVersion() {
    // No versioning logic here yet; you could add a version counter if needed.
  }

  async getVersion() {
    return 1; // Placeholder versioning logic.
  }

  async addNewsletter(email: string) {
    // Add email to your newsletter collection
    await this.db.collection("newsletter").insertOne({ email });
  }
}

// If MongoDB connection is available, use MongoStore; else, fallback to MemoryStore.
export const getStore = async () => {
  const { db } = await connectToDatabase();
  return new MongoStore(db);
};
