"use client";

import { useState, useEffect } from "react";
import { Hanko } from "@teamhanko/hanko-elements";

const hankoApi = process.env.NEXT_PUBLIC_HANKO_API_URL || "";

interface HankoUser {
  id?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export function useUserData(): HankoUser {
  const [hanko, setHanko] = useState<Hanko>();
  const [userState, setUserState] = useState<HankoUser>({
    id: "",
    email: "",
    name: "",
    avatarUrl: ""
  });

  useEffect(() => setHanko(new Hanko(hankoApi)), []);

  useEffect(() => {
    if (!hanko) return;

    hanko.user
      .getCurrent()
      .then(async (user) => {
        try {
          const userData: HankoUser = {
            id: user.id,
            email: user.email,
          };

          // Try to get user profile from your backend to populate name and avatar
          // This is just a placeholder - you would implement this based on your backend
          try {
            const response = await fetch(`/api/users/${user.id}`, {
              headers: { "Content-Type": "application/json" },
            });
            
            if (response.ok) {
              const userProfile = await response.json();
              userData.name = userProfile.name || user.email?.split('@')[0] || '';
              userData.avatarUrl = userProfile.avatarUrl || '';
            } else {
              // Fallback if no profile is found
              userData.name = user.email?.split('@')[0] || '';
            }
          } catch (error) {
            // Fallback to using email username as name if profile fetch fails
            userData.name = user.email?.split('@')[0] || '';
          }

          setUserState(userData);
        } catch (error) {
          console.error("Error setting user data:", error);
        }
      })
      .catch((error) => {
        console.error("Error getting user:", error);
      });
  }, [hanko]);

  return userState;
} 