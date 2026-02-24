"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../convex/_generated/api";

export function usePresence() {
  const { user } = useUser();
  const updatePresence = useMutation(api.users.updatePresence);
  const isOnlineRef = useRef(true);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    // Set online immediately
    const setOnline = () => {
      updatePresence({ clerkId: user.id, isOnline: true });
      lastUpdateRef.current = Date.now();
    };

    const setOffline = () => {
      updatePresence({ clerkId: user.id, isOnline: false });
      lastUpdateRef.current = Date.now();
    };

    setOnline();
    isOnlineRef.current = true;

    // Update presence every 20 seconds (heartbeat)
    const interval = setInterval(() => {
      if (isOnlineRef.current && !document.hidden) {
        setOnline();
      }
    }, 20000);

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isOnlineRef.current = isVisible;
      
      if (isVisible) {
        setOnline();
      } else {
        setOffline();
      }
    };

    // Handle page unload/close - use both events for better coverage
    const handleBeforeUnload = () => {
      isOnlineRef.current = false;
      // Use synchronous call for immediate effect
      updatePresence({ clerkId: user.id, isOnline: false });
    };

    const handleUnload = () => {
      isOnlineRef.current = false;
      updatePresence({ clerkId: user.id, isOnline: false });
    };

    // Handle page hide (more reliable than beforeunload on mobile)
    const handlePageHide = () => {
      isOnlineRef.current = false;
      updatePresence({ clerkId: user.id, isOnline: false });
    };

    // Handle focus/blur for additional reliability
    const handleFocus = () => {
      if (!isOnlineRef.current) {
        isOnlineRef.current = true;
        setOnline();
      }
    };

    const handleBlur = () => {
      // Don't immediately set offline on blur, wait for visibility change
      // This prevents false offline status when clicking outside the window
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      
      // Set offline when component unmounts
      setOffline();
    };
  }, [user, updatePresence]);
}
