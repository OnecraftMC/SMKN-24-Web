"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  apiRequest,
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "@/lib/admin/api";
import type { AdminUser, LoginResponse } from "@/lib/admin/types";

export type AuthStatus = "checking" | "authenticated" | "guest";

type AuthContextValue = {
  status: AuthStatus;
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Status sesi admin.
 *
 * - `checking`      : memvalidasi token tersimpan lewat /api/auth/me.php.
 * - `authenticated` : token valid, `user` terisi.
 * - `guest`         : tanpa token / token kedaluwarsa — dashboard mengarahkan
 *                     ke /login.
 *
 * Token disimpan di localStorage (kunci di lib/api.ts) dan dikirim otomatis
 * oleh apiRequest sebagai `Authorization: Bearer`. Backend belum punya revoke,
 * jadi logout hanya menghapus token lokal (tetap valid sampai 8 jam).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken();

    if (!token) {
      // setStatus sinkron di body effect dilarang (react-hooks/set-state-in-effect);
      // antre lewat microtask.
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setStatus("guest");
        }
      });
      return () => {
        cancelled = true;
      };
    }

    apiRequest<AdminUser>("/api/auth/me.php", { token })
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        // Token rusak/kedaluwarsa: buang, jangan biarkan UI menganggap sukses.
        if (!cancelled) {
          clearStoredToken();
          setUser(null);
          setStatus("guest");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiRequest<LoginResponse>("/api/auth/login.php", {
      method: "POST",
      body: { username, password },
    });
    storeToken(res.token);
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider.");
  }
  return ctx;
}
