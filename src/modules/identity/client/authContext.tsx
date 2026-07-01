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
  clearSessionToken,
  getSessionToken,
  saveSessionToken,
} from "./authStorage";

import {
  loginRequest,
  logoutRequest,
  meRequest,
  type AuthUser,
} from "./authClient";

import {
  clearCachedAuthUser,
  readCachedAuthUser,
  writeCachedAuthUser,
} from "./authSessionCache";

import { isHttpClientError } from "@/shared/http/httpClient";

import {
  resolveSubscriptionState,
  type SubscriptionStateResult,
} from "@/modules/subscription/application/resolveSubscriptionState";

type RefreshUserOptions = {
  silent?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydratedFromCache: boolean;
  lastAuthError: string | null;
  subscriptionState: SubscriptionStateResult | null;
  needs2FA: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshUser: (options?: RefreshUserOptions) => Promise<void>;

  primeAuthSession: (user: AuthUser) => void;

  clearAuthError: () => void;
};

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isHydratedFromCache, setIsHydratedFromCache] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [lastAuthError, setLastAuthError] =
    useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setLastAuthError(null);
  }, []);

  const clearLocalSession = useCallback(() => {
    clearSessionToken();
    clearCachedAuthUser();
    setUser(null);
    setIsHydratedFromCache(false);
  }, []);

  const primeAuthSession = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setIsHydratedFromCache(true);
    setIsLoading(false);
    setLastAuthError(null);
    writeCachedAuthUser(nextUser);
  }, []);

  const refreshUser = useCallback(async (options: RefreshUserOptions = {}) => {
    const silent = options.silent === true;
    const hadLocalToken =
      Boolean(getSessionToken());

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const currentUser =
        await meRequest();

      setUser(currentUser);
      setIsHydratedFromCache(false);
      writeCachedAuthUser(currentUser);
      setLastAuthError(null);
    } catch (error) {
      clearLocalSession();

      if (isHttpClientError(error)) {
        if (error.status === 401) {
          setLastAuthError(
            hadLocalToken
              ? "Sesión expirada. Inicia sesión nuevamente."
              : null,
          );
        } else if (error.status === 402) {
          setLastAuthError(
            "Suscripción requerida para continuar.",
          );
        } else if (error.status === 403) {
          setLastAuthError(
            "Tu cuenta no tiene permisos para acceder.",
          );
        } else {
          setLastAuthError(error.message);
        }
      } else {
        setLastAuthError(
          "No fue posible validar la sesión.",
        );
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [clearLocalSession]);

  useEffect(() => {
    const cachedUser = readCachedAuthUser();

    if (cachedUser) {
      setUser(cachedUser);
      setIsHydratedFromCache(true);
    }

    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (
      email: string,
      password: string,
    ) => {
      setIsLoading(true);

      setLastAuthError(null);

      try {
        const result =
          await loginRequest(
            email,
            password,
          );

        saveSessionToken(result.token);
        primeAuthSession(result.user);
      } catch (error) {
        if (isHttpClientError(error)) {
          setLastAuthError(error.message);
        } else {
          setLastAuthError(
            "No fue posible iniciar sesión.",
          );
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [primeAuthSession],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Si el servidor falla, igualmente limpiamos cliente.
    } finally {
      clearLocalSession();
      setLastAuthError(null);
    }
  }, [clearLocalSession]);

  const subscriptionState =
    useMemo(() => {
      if (!user) return null;

      return resolveSubscriptionState({
        role: user.role,
        status: user.status,
        subscriptionPlan:
          user.subscriptionPlan,
        subscriptionExpiresAt:
          user.subscriptionExpiresAt,
      });
    }, [user]);

  const needs2FA = useMemo(() => {
    return !!user && user.twoFactorEnabled !== true;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isHydratedFromCache,
      lastAuthError,
      subscriptionState,
      needs2FA,
      login,
      logout,
      refreshUser,
      primeAuthSession,
      clearAuthError,
    }),
    [
      user,
      isLoading,
      isHydratedFromCache,
      lastAuthError,
      subscriptionState,
      needs2FA,
      login,
      logout,
      refreshUser,
      primeAuthSession,
      clearAuthError,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider",
    );
  }

  return context;
}
