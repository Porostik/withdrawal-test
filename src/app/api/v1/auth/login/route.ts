import { NextResponse } from "next/server";
import { createSession } from "@/server/inmemory/sessionsRepo";
import { getOrCreateUser } from "@/server/inmemory/usersRepo";

const SESSION_COOKIE = "session";
const MAX_AGE = 60 * 60;

export async function POST(request: Request) {
  let body: { login?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const login = typeof body.login === "string" ? body.login.trim() : "";
  const password =
    typeof body.password === "string" ? body.password.trim() : "";
  if (!login || !password) {
    return NextResponse.json(
      { message: "Login and password are required" },
      { status: 400 },
    );
  }

  const user = await getOrCreateUser(login);
  const sessionId = await createSession(user.userId);

  const response = NextResponse.json(
    { userId: user.userId, login: user.login },
    { status: 200 },
  );
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });
  return response;
}
