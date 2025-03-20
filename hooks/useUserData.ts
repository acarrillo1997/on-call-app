"use client";

import { useState, useEffect } from "react";
import { Hanko } from "@teamhanko/hanko-elements";

const hankoApi = process.env.NEXT_PUBLIC_HANKO_API_URL || "";

interface HankoUser {
  id: string;
  email: string;
  loading: boolean;
  error: string | null;
}

export function useUserData(): HankoUser {
  const [hanko, setHanko] = useState<Hanko>();
  const [userState, setUserState] = useState<HankoUser>({
    id: "",
    email: "",
    loading: true,
    error: null,
  });

  useEffect(() => setHanko(new Hanko(hankoApi)), []);

  useEffect(() => {
    if (!hanko) return;

    hanko.user
      .getCurrent()
      .then((user) => {
        setUserState({ 
          id: user.id, 
          email: user.email || "", 
          loading: false, 
          error: null 
        });
      })
      .catch((error) => {
        setUserState((prevState) => ({ 
          ...prevState, 
          loading: false, 
          error: error instanceof Error ? error.message : "Failed to get user data" 
        }));
      });
  }, [hanko]);

  return userState;
} 