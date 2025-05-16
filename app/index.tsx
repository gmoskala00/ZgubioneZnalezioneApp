import { useEffect } from "react";
import { router } from "expo-router";

export default function AppEntry() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/auth/login");
    }, 0);
  }, []);

  return null;
}
