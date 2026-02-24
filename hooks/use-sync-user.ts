"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";

export function useSyncUser() {
  const { user } = useUser();
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (user) {
      syncUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || user.username || "Anonymous",
        imageUrl: user.imageUrl,
      });
    }
  }, [user, syncUser]);
}
