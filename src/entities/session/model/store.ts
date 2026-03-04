import { create } from "zustand";

type SessionStatus = "unknown" | "loading" | "authed" | "guest";

interface SessionState {
  status: SessionStatus;
  user?: { login: string };
}

interface SessionActions {
  loadMe: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
}

const base =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  status: "unknown",
  user: undefined,

  loadMe: async () => {
    set({ status: "loading" });
    try {
      const res = await fetch(`${base}/api/v1/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        set({
          status: "authed",
          user: { login: data.login },
        });
      } else {
        set({ status: "guest", user: undefined });
      }
    } catch {
      set({ status: "guest", user: undefined });
    }
  },

  login: async (login: string, password: string) => {
    set({ status: "loading" });
    try {
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (!res.ok) {
        set({ status: "guest" });
        return;
      }
      const data = await res.json();
      set({
        status: "authed",
        user: { login: data.login },
      });
    } catch {
      set({ status: "guest" });
    }
  },
}));
