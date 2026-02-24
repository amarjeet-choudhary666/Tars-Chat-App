"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";

export function usePresence() {
  const { user } = useUser();
  const updatePresence = useMutation(api.users.updatePresence);

  useEffect(() => {
    if (!user) return;

    updatePresence({ clerkId: user.id, isOnline: true });

    const interval = setInterval(() => {
      updatePresence({ clerkId: user.id, isOnline: true });
    }, 30000);

    const handleVisibilityChange = () => {
      updatePresence({
        clerkId: user.id,
        isOnline: !document.hidden,
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      updatePresence({ clerkId: user.id, isOnline: false });
    };
  }, [user, updatePresence]);
}
