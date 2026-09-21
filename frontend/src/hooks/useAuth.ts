"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { User } from "@/types";

/**
 * Safely decodes the payload of a JWT without any external library.
 * Uses URL-safe base64 decoding so it works with both standard and URL-safe JWTs.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Convert URL-safe base64 → standard base64, then decode
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.replace("/login");
      setIsLoading(false);
      return;
    }

    // ── Strategy 1: decode from JWT payload (zero network cost) ──────────────
    const payload = decodeJwtPayload(token);
    if (payload) {
      const id = (payload.sub ?? payload.id) as string | undefined;
      const email = payload.email as string | undefined;
      const role = payload.role as User["role"] | undefined;

      if (id && email && role) {
        setUser({ id, email, role });
        setIsLoading(false);
        return;
      }
    }

    // ── Strategy 2: fallback to /auth/me API call ─────────────────────────────
    api
      .get<User>("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
        router.replace("/login");
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    router.push("/login");
  }, [router]);

  return { user, isLoading, logout };
}
