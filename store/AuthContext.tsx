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
import { API_URL } from "../constants/api";

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
  authenticate: (userId: string, token: string) => {},
  userData: null,
  setUserData: (data: UserData) => {},
  logout: () => {},
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      const storedUserId = await SecureStore.getItemAsync("userId");

      if (storedToken && storedUserId) {
        setToken(storedToken);
        setUserId(storedUserId);
        router.replace("/(tabs)/home");
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error("Falied to load user: ", (error as Error).message);
      }
    };

    if (userId && token) {
      fetchUser();
    }
  }, [userId, token]);

  const authenticate = async (userId: string, token: string) => {
    setToken(token);
    setUserId(userId);
    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("userId", userId);
    router.replace("/(tabs)/home");
  };

  const logout = async () => {
    setUserData(null);
    setUserId("");
    setToken(null);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("userId");
    router.replace("/auth/login");
  };

  const value = {
    userId: userId,
    token: token,
    isAuthenticated: !!token,
    authenticate: authenticate,
    userData: userData,
    setUserData: setUserData,
    logout: logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext not found!");
  return context;
}
