import AuthContent from "../../components/Auth/AuthContent";
import { AuthCredentials } from "../../models/auth";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../store/AuthContext";
import { useState } from "react";
import LoadingOverlay from "../../components/UI/LoadingOverlay";
import Toast from "react-native-toast-message";

const RegisterScreen = () => {
  const { authenticate } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const registerUser = async (credentials: AuthCredentials) => {
    try {
      setIsAuthenticating(true);
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      authenticate(data.user._id, data.token);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "❌ Registration Fail",
        text2: (err as Error).message,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isAuthenticating) {
    return <LoadingOverlay message="Creating User..." />;
  }

  return <AuthContent isLogin={false} onAuthenticate={registerUser} />;
};

export default RegisterScreen;
