"use client";

import { useEffect } from "react";
import { register } from "@teamhanko/hanko-elements";
import { useRouter } from "next/navigation";

const hankoApi = process.env.NEXT_PUBLIC_HANKO_API_URL || "";

export default function HankoAuth() {
  const router = useRouter();

  useEffect(() => {
    // Register Hanko elements
    register(hankoApi).catch((error) => {
      console.error("Error registering Hanko elements:", error);
    });

    // Handle authentication events
    const hankoAuth = document.querySelector("hanko-auth");
    if (hankoAuth) {
      hankoAuth.addEventListener("success", () => {
        router.push("/dashboard");
        router.refresh();
      });
    }

    return () => {
      if (hankoAuth) {
        hankoAuth.removeEventListener("success", () => {});
      }
    };
  }, [router]);

  return <hanko-auth />;
} 