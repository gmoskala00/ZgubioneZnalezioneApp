import { router } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserData } from "../models/auth";
import { API_URL } from "../constants/api";

type AuthContextType = {
  userId: string;
  isAuthenticated: boolean;
  authenticate: (userId: string) => void;
  userData: UserData | null;
  setUserData: (data: UserData) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  userId: "",
  isAuthenticated: false,
  authenticate: (userId: string) => {},
  userData: null,
  setUserData: (data: UserData) => {},
  logout: () => {},
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${userId}`);
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error("Falied to load user: ", (error as Error).message);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const authenticate = (userId: string) => {
    setUserId(userId);
    router.replace("/(tabs)/home");
  };

  const logout = () => {
    setUserData(null);
    setUserId("");
    router.replace("/auth/login");
  };

  const value = {
    userId: userId,
    isAuthenticated: !!userId,
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
