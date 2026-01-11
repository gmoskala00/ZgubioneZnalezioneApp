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
import { router } from "expo-router";
import LoadingOverlay from "../components/UI/LoadingOverlay";

type AuthContextType = {
  userId: string;
  token: string | null;
  isAuthenticated: boolean;
  authenticate: (userId: string, token: string) => Promise<void>;
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
  logout: () => Promise<void>;
  refreshMe: () => void;
  isHydrating: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  userId: "",
  token: null,
  isAuthenticated: false,
  authenticate: async () => {},
  userData: null,
  setUserData: () => {},
  logout: async () => {},
  refreshMe: () => {},
  isHydrating: true,
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUserId] = await Promise.all([
          SecureStore.getItemAsync("token"),
          SecureStore.getItemAsync("userId"),
        ]);
        if (storedToken && storedUserId) {
          setToken(storedToken);
          setAuthToken(storedToken);
          setUserId(storedUserId);
        }
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isHydrating) return;
    setOnUnauthorized(() => logout);
    return () => setOnUnauthorized(null);
  }, [isHydrating]);

  useEffect(() => {
    (async () => {
      if (!token || !userId) return;
      try {
        const data = await Api.getMe();
        setUserData(data);
        router.replace("/(tabs)/home");
      } catch (e: any) {
        console.warn("getMe failed:", e?.message || e);
        await logout();
      }
    })();
  }, [token, userId]);

  const authenticate = async (uid: string, t: string) => {
    setToken(t);
    setAuthToken(t);
    setUserId(uid);
    await SecureStore.setItemAsync("token", t);
    await SecureStore.setItemAsync("userId", uid);
  };

  const logout = async () => {
    setUserData(null);
    setUserId("");
    setToken(null);
    setAuthToken(null);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("userId");
    router.replace("/auth/login");
  };

  const refreshMe = async () => {
    if (!token || !userId) return;
    const data = await Api.getMe();
    setUserData(data);
  };

  const value: AuthContextType = {
    userId,
    token,
    isAuthenticated: !!token,
    authenticate,
    userData,
    setUserData,
    logout,
    refreshMe,
    isHydrating,
  };

  if (isHydrating) return <LoadingOverlay message="Uruchamianie..." />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext not found!");
  return ctx;
}
