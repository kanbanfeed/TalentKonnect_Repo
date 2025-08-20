// api/_store.ts
type User = { id: string; name?: string; tickets: number };

const state = {
  users: new Map<string, User>(),
  version: 0,
  newsletter: new Set<string>(),
};

export function upsertUser(id: string, name?: string) {
  const key = String(id || '').toLowerCase();
  if (!key) return;
  const existing = state.users.get(key);
  if (existing) { if (name) existing.name = name; return existing; }
  const u: User = { id: key, name, tickets: 0 };
  state.users.set(key, u);
  return u;
}
export function addTickets(id: string, n = 1) {
  const u = upsertUser(id);
  if (!u) return 0;
  u.tickets += Number(n || 0);
  return u.tickets;
}
export function getTickets(id: string) {
  const u = state.users.get(String(id || '').toLowerCase());
  return u?.tickets ?? 0;
}
export function leaderboard() { return Array.from(state.users.values()).sort((a,b)=>b.tickets-a.tickets); }
export function totalTickets() { return leaderboard().reduce((s,u)=>s+u.tickets,0); }
export function pickWinner() {
  const list = leaderboard(); const total = totalTickets(); if (!total) return null;
  let r = Math.floor(Math.random()*total)+1;
  for (const u of list) { r -= u.tickets; if (r<=0) return u; }
  return null;
}
export function bumpVersion(){ state.version++; }
export function getVersion(){ return state.version; }
export function addNewsletter(email: string){ state.newsletter.add(email.toLowerCase()); }
