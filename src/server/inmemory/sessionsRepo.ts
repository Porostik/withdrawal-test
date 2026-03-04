import { getRedis } from "@/shared/redis";

export async function createSession(userId: string): Promise<string> {
  const redis = await getRedis();
  const sessionId = crypto.randomUUID();
  await redis.set(`session:${sessionId}`, userId);
  return sessionId;
}

export async function getSession(
  sessionId: string,
): Promise<{ userId: string } | null> {
  const redis = await getRedis();
  const entry = await redis.get(`session:${sessionId}`);
  if (!entry) return null;
  return { userId: entry };
}

export async function getUserId(sessionId: string): Promise<string | null> {
  const redis = await getRedis();
  const userId = await redis.get(`session:${sessionId}`);
  return userId ?? null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const redis = await getRedis();
  await redis.del(`session:${sessionId}`);
}
