"use client";

import { useCallback, useEffect, useState } from "react";
import { register, Hanko } from "@teamhanko/hanko-elements";
import { useRouter } from "next/navigation";

export const useHanko = () => {
  const router = useRouter();
  const [hanko, setHanko] = useState<Hanko>();
  const hankoApi = process.env.NEXT_PUBLIC_HANKO_API_URL || "";

  // Initialize Hanko instance
  useEffect(() => {
    setHanko(new Hanko(hankoApi));
  }, [hankoApi]);

  // Register custom elements
  useEffect(() => {
    register(hankoApi).catch((error) => {
      console.error("Error registering Hanko elements:", error);
    });
  }, [hankoApi]);

  // Set up event listeners
  useEffect(() => {
    if (!hanko) return;

    // Handle session creation (login success)
    const sessionCreatedUnsubscribe = hanko.onSessionCreated(() => {
      router.push("/dashboard");
      router.refresh();
    });

    return () => {
      sessionCreatedUnsubscribe?.();
    };
  }, [hanko, router]);

  // Log out the user
  const logout = useCallback(async () => {
    try {
      await hanko?.user.logout();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, [hanko, router]);

  return { logout, hanko };
}; 