import { Alert } from "react-native";
import AuthContent from "../../components/Auth/AuthContent";
import { AuthCredentials } from "../../models/auth";

const RegisterScreen = () => {
  const registerUser = async (credentials: AuthCredentials) => {
    try {
      const response = await fetch("http://10.0.2.2:5000/api/auth/register", {
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

      Alert.alert("✅ Registered:", data.message);
    } catch (err) {
      Alert.alert("❌ Registration Fail:", (err as Error).message);
    }
  };

  return <AuthContent isLogin={false} onAuthenticate={registerUser} />;
};

export default RegisterScreen;
