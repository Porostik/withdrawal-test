const base =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

export async function login(
  loginName: string,
  password: string,
): Promise<{ userId: string; login: string }> {
  const res = await fetch(`${base}/api/auth/v1/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: loginName, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function getMe(): Promise<{ userId: string; login: string }> {
  const res = await fetch(`${base}/api/v1/auth/me`, { credentials: "include" });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${base}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
