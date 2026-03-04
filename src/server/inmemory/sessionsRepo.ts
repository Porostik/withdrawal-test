const sessions = new Map<string, { userId: string; createdAt: number }>();

export function createSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { userId, createdAt: Date.now() });
  return sessionId;
}

export function getSession(sessionId: string): { userId: string } | null {
  const entry = sessions.get(sessionId);
  if (!entry) return null;
  return { userId: entry.userId };
}

export function getUserId(sessionId: string): string | null {
  const entry = sessions.get(sessionId);
  return entry?.userId ?? null;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
