import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AUTH_RETURN_URL_KEY = "split-ease:return-url";

type AuthSessionContextValue = {
  user: User | null;
  isReady: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

export const normalizeReturnUrl = (value?: string | null, fallback = "/dashboard") => {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  return value === "/auth" ? fallback : value;
};

export const setPendingReturnUrl = (value?: string | null) => {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(AUTH_RETURN_URL_KEY, normalizeReturnUrl(value));
};

export const consumePendingReturnUrl = (fallback = "/dashboard") => {
  if (typeof window === "undefined") return fallback;

  const value = window.sessionStorage.getItem(AUTH_RETURN_URL_KEY);
  window.sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
  return normalizeReturnUrl(value, fallback);
};

export const AuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setUser(session?.user ?? null);
      setIsReady(true);
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      setIsReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, isReady }), [user, isReady]);

  return createElement(AuthSessionContext.Provider, { value }, children);
};

export const useAuthSession = () => {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within an AuthSessionProvider");
  }

  return context;
};