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

import { isHttpClientError } from "@/shared/http/httpClient";

import {
  resolveSubscriptionState,
  type SubscriptionStateResult,
} from "@/modules/subscription/application/resolveSubscriptionState";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastAuthError: string | null;
  subscriptionState: SubscriptionStateResult | null;
  needs2FA: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;

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

  const [isLoading, setIsLoading] =
    useState(true);

  const [lastAuthError, setLastAuthError] =
    useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setLastAuthError(null);
  }, []);

  const clearLocalSession = useCallback(() => {
    clearSessionToken();
    setUser(null);
  }, []);

  /**
   * IMPORTANTE:
   *
   * Antes el sistema dependía de localStorage
   * para decidir si existía sesión.
   *
   * Ahora la fuente principal es la cookie HTTPOnly.
   *
   * Por eso SIEMPRE consultamos /api/me.
   */
  const refreshUser = useCallback(async () => {
    const hadLocalToken =
      Boolean(getSessionToken());

    setIsLoading(true);

    try {
      const currentUser =
        await meRequest();

      setUser(currentUser);

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
      setIsLoading(false);
    }
  }, [clearLocalSession]);

  useEffect(() => {
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

        /**
         * Se mantiene temporalmente
         * por compatibilidad.
         *
         * La cookie HTTPOnly ya es
         * suficiente para auth real.
         */
        saveSessionToken(result.token);

        setUser(result.user);
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
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /**
       * Si el servidor falla,
       * igualmente limpiamos cliente.
       */
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
    lastAuthError,
    subscriptionState,
    needs2FA,
    login,
    logout,
    refreshUser,
    clearAuthError,
  }),
  [
    user,
    isLoading,
    lastAuthError,
    subscriptionState,
    needs2FA,
    login,
    logout,
    refreshUser,
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