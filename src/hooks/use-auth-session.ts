import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AUTH_RETURN_URL_KEY = "split-ease:return-url";

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

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      setIsReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      setIsReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isReady };
};