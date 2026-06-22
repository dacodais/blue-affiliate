"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AffiliateProfile } from "@/types/api";

interface AuthContextValue {
  token: string | null;
  affiliate: AffiliateProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "affiliate_token";
const AFFILIATE_KEY = "affiliate_profile";

function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedAffiliate = localStorage.getItem(AFFILIATE_KEY);

    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      if (storedAffiliate) {
        setAffiliate(JSON.parse(storedAffiliate));
      }
    } else if (storedToken) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AFFILIATE_KEY);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const res = await api.login(email, password, rememberMe);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(AFFILIATE_KEY, JSON.stringify(res.affiliate));
      setToken(res.token);
      setAffiliate(res.affiliate);
      router.push("/");
    },
    [router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AFFILIATE_KEY);
    setToken(null);
    setAffiliate(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        token,
        affiliate,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
