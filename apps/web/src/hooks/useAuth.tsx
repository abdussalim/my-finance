import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";

interface AuthStatus {
  isSetup: boolean;
  isLoggedIn: boolean;
  lockedUntil: string | null;
}

interface AuthContextType {
  isSetup: boolean;
  isLoggedIn: boolean;
  lockedUntil: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (pin: string) => Promise<void>;
  setup: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSetup, setIsSetup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await apiFetch<AuthStatus>("/api/auth/status");
      setIsSetup(data.isSetup);
      setIsLoggedIn(data.isLoggedIn);
      setLockedUntil(data.lockedUntil);
    } catch {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (pin: string) => {
    await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
    await refresh();
  };

  const setup = async (pin: string) => {
    await apiFetch("/api/auth/setup", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
    await refresh();
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{ isSetup, isLoggedIn, lockedUntil, loading, refresh, login, setup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
