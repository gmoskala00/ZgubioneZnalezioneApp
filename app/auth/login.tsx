import { Alert } from "react-native";
import AuthContent from "../../components/Auth/AuthContent";
import { LoginCredentials } from "../../models/auth";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../store/AuthContext";
import LoadingOverlay from "../../components/UI/LoadingOverlay";
import { useState } from "react";

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
    } catch (error) {
      Alert.alert("Login Failed ", (error as Error).message);
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
