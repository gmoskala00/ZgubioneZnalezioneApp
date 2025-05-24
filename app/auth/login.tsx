import { Alert } from "react-native";
import AuthContent from "../../components/Auth/AuthContent";
import { LoginCredentials } from "../../models/auth";
import { router } from "expo-router";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../store/AuthContext";

const LoginScreen = () => {
  const { authenticate } = useAuth();

  const loginUser = async (credentials: LoginCredentials) => {
    try {
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

      authenticate(data.user._id);

      // Alert.alert("Logged in", "", [
      //   {
      //     text: "OK",
      //     onPress: () => {
      //       router.replace("/(tabs)/home");
      //     },
      //   },
      // ]);
    } catch (error) {
      Alert.alert("Login Failed ", (error as Error).message);
    }
  };

  return <AuthContent isLogin onAuthenticate={loginUser} />;
};

export default LoginScreen;
