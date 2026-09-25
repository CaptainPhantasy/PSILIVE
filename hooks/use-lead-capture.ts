"use client";

import { useCallback, useRef, useEffect } from "react";
import { setUserData } from "@/lib/analytics";

const LEAD_SESSION_KEY = "psi_lead_session";
const INACTIVITY_DELAY = 2 * 60 * 1000; // 2 minutes

function getOrCreateSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = sessionStorage.getItem(LEAD_SESSION_KEY);
  if (!token) {
    token = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem(LEAD_SESSION_KEY, token);
  }
  return token;
}

export function useLeadCapture(source?: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasContactInfoRef = useRef(false);
  const sessionTokenRef = useRef("");

  useEffect(() => {
    sessionTokenRef.current = getOrCreateSessionToken();
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (hasContactInfoRef.current && sessionTokenRef.current) {
      timerRef.current = setTimeout(async () => {
        try {
          await fetch("/api/leads/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken: sessionTokenRef.current }),
          });
        } catch (e) {
          console.error("Lead notify failed:", e);
        }
      }, INACTIVITY_DELAY);
    }
  }, []);

  const captureField = useCallback(
    async (fields: Record<string, string>) => {
      const token = sessionTokenRef.current;
      if (!token) return;

      // Check if we have contactable info
      const hasEmail = !!fields.email;
      const hasPhone = !!fields.phone;
      if (!hasEmail && !hasPhone && !hasContactInfoRef.current) return;

      if (hasEmail || hasPhone) {
        hasContactInfoRef.current = true;
      }

      // Also push user-provided data to GA for Enhanced Conversions
      setUserData({
        email: fields.email,
        phone: fields.phone,
        firstName: fields.firstName || fields.name,
        lastName: fields.lastName,
        street: fields.address || fields.streetAddress,
        city: fields.city,
        region: fields.state,
        postalCode: fields.zip || fields.zipCode,
      });

      try {
        await fetch("/api/leads/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken: token,
            ...fields,
            source: source || "website",
            pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
          }),
        });
      } catch (e) {
        console.error("Lead capture failed:", e);
      }

      // Reset the 2-minute inactivity timer
      resetInactivityTimer();
    },
    [source, resetInactivityTimer]
  );

  const markConverted = useCallback(async () => {
    const token = sessionTokenRef.current;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    try {
      await fetch("/api/leads/mark-converted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token }),
      });
    } catch (e) {
      console.error("Lead mark-converted failed:", e);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { captureField, markConverted };
}
