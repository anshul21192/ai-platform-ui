export interface AuthUser {
  userId: string;
  username: string;
  displayName: string;
}

const USERS: Record<string, { password: string; userId: string; displayName: string }> = {
  "john@vault.bank": { password: "demo123", userId: "U1023", displayName: "John Doe" },
  "attacker@evil.com": { password: "stolen", userId: "U9999", displayName: "Attacker" },
};

export function authenticate(username: string, password: string): AuthUser | null {
  const user = USERS[username];
  if (!user || user.password !== password) return null;
  return { userId: user.userId, username, displayName: user.displayName };
}

export function createSessionId(): string {
  return crypto.randomUUID();
}
