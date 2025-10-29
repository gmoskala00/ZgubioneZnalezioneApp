import AuthContent from "../../components/Auth/AuthContent";
import { AuthCredentials } from "../../models/auth";
import { useAuth } from "../../store/AuthContext";
import { useState } from "react";
import LoadingOverlay from "../../components/UI/LoadingOverlay";
import Toast from "react-native-toast-message";
import { Api } from "../../services/api";

const RegisterScreen = () => {
  const { authenticate } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const registerUser = async (credentials: AuthCredentials) => {
    try {
      setIsAuthenticating(true);
      const { user, token } = await Api.register(credentials);
      authenticate(user._id, token);
      Toast.show({ type: "success", text1: "Rejestracja zakończona!" });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Błąd rejestracji",
        text2: (error as Error).message,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isAuthenticating) return <LoadingOverlay message="Tworzenie konta..." />;

  return <AuthContent isLogin={false} onAuthenticate={registerUser} />;
};

export default RegisterScreen;
