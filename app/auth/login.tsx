import AuthContent from "../../components/Auth/AuthContent";
import { LoginCredentials } from "../../models/auth";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../store/AuthContext";
import LoadingOverlay from "../../components/UI/LoadingOverlay";
import { useState } from "react";
import Toast from "react-native-toast-message";

const LoginScreen = () => {
  const { authenticate } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const loginUser = async (credentials: LoginCredentials) => {
    try {
      setIsAuthenticating(true);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const raw = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(raw);
      } catch {
        console.warn("⚠️ Server did not return JSON:", raw.slice(0, 120));
      }

      if (!response.ok) {
        const msg = data?.message || raw.slice(0, 100) || "Login failed";
        throw new Error(msg);
      }

      if (!data?.user?._id) {
        throw new Error("Invalid response from server.");
      }

      authenticate(data.user._id, data.token);

      Toast.show({
        type: "success",
        text1: "Zalogowano pomyślnie",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: (error as Error).message,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isAuthenticating) {
    return <LoadingOverlay message="Logging in..." />;
  }

  return <AuthContent isLogin onAuthenticate={loginUser} />;
};

export default LoginScreen;
