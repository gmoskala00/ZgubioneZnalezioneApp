import AuthContent from "../../components/Auth/AuthContent";
import { LoginCredentials } from "../../models/auth";
import { useAuth } from "../../store/AuthContext";
import LoadingOverlay from "../../components/UI/LoadingOverlay";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { Api } from "../../services/api";

const LoginScreen = () => {
  const { authenticate } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const loginUser = async (credentials: LoginCredentials) => {
    try {
      setIsAuthenticating(true);
      const { user, token } = await Api.login(credentials);
      authenticate(user._id, token);
      Toast.show({ type: "success", text1: "Zalogowano pomyślnie" });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Nie udało się zalogować",
        text2: (error as Error).message,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isAuthenticating) return <LoadingOverlay message="Logowanie..." />;

  return <AuthContent isLogin onAuthenticate={loginUser} />;
};

export default LoginScreen;
