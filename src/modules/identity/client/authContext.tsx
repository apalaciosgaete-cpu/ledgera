"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearSessionToken, getSessionToken, saveSessionToken } from "./authStorage";
import { loginRequest, logoutRequest, meRequest, type AuthUser } from "./authClient";
import { isHttpClientError } from "@/shared/http/httpClient";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastAuthError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAuthError, setLastAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setLastAuthError(null);
  }, []);

  const clearLocalSession = useCallback(() => {
    clearSessionToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getSessionToken();

    if (!token) {
      clearLocalSession();
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await meRequest();
      setUser(currentUser);
      setLastAuthError(null);
    } catch (error) {
      clearLocalSession();

      if (isHttpClientError(error)) {
        if (error.status === 401) {
          setLastAuthError("Sesión expirada. Inicia sesión nuevamente.");
        } else if (error.status === 403) {
          setLastAuthError("Tu cuenta no tiene permisos para acceder.");
        } else {
          setLastAuthError(error.message);
        }
      } else {
        setLastAuthError("No fue posible validar la sesión.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearLocalSession]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setLastAuthError(null);

    try {
      const result = await loginRequest(email, password);
      saveSessionToken(result.token);
      setUser(result.user);
    } catch (error) {
      if (isHttpClientError(error)) {
        setLastAuthError(error.message);
      } else {
        setLastAuthError("No fue posible iniciar sesión.");
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Si el servidor falla, igualmente se limpia la sesión local.
    } finally {
      clearLocalSession();
      setLastAuthError(null);
    }
  }, [clearLocalSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      lastAuthError,
      login,
      logout,
      refreshUser,
      clearAuthError,
    }),
    [
      user,
      isLoading,
      lastAuthError,
      login,
      logout,
      refreshUser,
      clearAuthError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}