import { useEffect } from "react";
import { router } from "expo-router";

export default function AppEntry() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/auth/login");
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return null;
}
