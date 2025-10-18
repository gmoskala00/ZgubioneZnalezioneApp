import { router } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { UserData } from "../models/auth";
import { Api } from "../services/api";
import { setAuthToken, setOnUnauthorized } from "../services/http";

type AuthContextType = {
  userId: string;
  token: string | null;
  isAuthenticated: boolean;
  authenticate: (userId: string, token: string) => void;
  userData: UserData | null;
  setUserData: (data: UserData) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  userId: "",
  token: null,
  isAuthenticated: false,
  authenticate: () => {},
  userData: null,
  setUserData: () => {},
  logout: () => {},
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  // 🔹 Ładowanie tokena po starcie aplikacji
  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      const storedUserId = await SecureStore.getItemAsync("userId");

      if (storedToken && storedUserId) {
        setToken(storedToken);
        setAuthToken(storedToken);
        setUserId(storedUserId);
        router.replace("/(tabs)/home");
      }
    };
    loadToken();
  }, []);

  // 🔹 Globalne ustawienie tokena i handlera 401
  useEffect(() => {
    setAuthToken(token);
    setOnUnauthorized(() => logout);
    return () => setOnUnauthorized(null);
  }, [token]);

  // 🔹 Pobieranie danych użytkownika po zalogowaniu
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await Api.getMe();
        setUserData(data);
      } catch (error: any) {
        if (error?.message === "Unauthorized") {
          await logout();
        } else {
          console.error("Failed to load user:", error?.message);
        }
      }
    };

    if (userId && token) fetchUser();
  }, [userId, token]);

  // 🔹 Logowanie
  const authenticate = async (userId: string, token: string) => {
    setToken(token);
    setAuthToken(token);
    setUserId(userId);

    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("userId", userId);

    router.replace("/(tabs)/home");
  };

  // 🔹 Wylogowanie
  const logout = async () => {
    setUserData(null);
    setUserId("");
    setToken(null);
    setAuthToken(null); // <— czyścimy globalny token

    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("userId");

    router.replace("/auth/login");
  };

  const value = {
    userId,
    token,
    isAuthenticated: !!token,
    authenticate,
    userData,
    setUserData,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext not found!");
  return context;
}
