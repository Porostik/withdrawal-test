import { cookies } from "next/headers";
import { getUserId } from "@/server/inmemory/sessionsRepo";
import {} from "redis";

export async function getUserFromRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie?.value) return null;
  return getUserId(sessionCookie.value);
}
