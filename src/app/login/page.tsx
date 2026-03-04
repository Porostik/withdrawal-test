"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/entities/session/model/store";

export default function LoginPage() {
  const router = useRouter();
  const { status: sessionStatus, login } = useSessionStore();
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    useSessionStore.getState().loadMe();
  }, []);

  useEffect(() => {
    if (sessionStatus === "authed") {
      router.replace("/withdraw");
    }
  }, [sessionStatus, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput.trim()) return;
    setIsLoggingIn(true);
    try {
      await login(loginInput.trim(), passwordInput.trim());
      router.replace("/withdraw");
    } finally {
      setIsLoggingIn(false);
    }
  }

  if (sessionStatus === "loading" || sessionStatus === "unknown") {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (sessionStatus === "authed") {
    return null;
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-xl font-semibold">Login</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="mt-1 text-sm text-muted-foreground">
          Enter any login and password (mock auth).
        </p>
        <form onSubmit={handleLogin} className="mt-4 space-y-4">
          <div>
            <label htmlFor="login" className="text-sm font-medium">
              Login
            </label>
            <input
              id="login"
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isLoggingIn ? "Logging in…" : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
