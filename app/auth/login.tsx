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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login Failed");
      }

      if (!data.user || !data.user._id) {
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
