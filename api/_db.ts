type RaffleState = {
  tickets: Record<string, number>;
  users: Record<string, { id: string; email?: string; credits?: number }>;
  raffle: { lastWinner?: any; history: any[] };
  newsletter: string[];
};

const g = globalThis as any;
g.__MEMO_DB__ ||= { tickets: {}, users: {}, raffle: { history: [] }, newsletter: [] } as RaffleState;

export function db() {
  return g.__MEMO_DB__ as RaffleState;
}
