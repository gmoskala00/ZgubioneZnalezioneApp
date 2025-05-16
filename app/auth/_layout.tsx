import { Stack } from "expo-router";
import { GlobalStyles } from "../../constants/style";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: "black",
        contentStyle: {
          backgroundColor: GlobalStyles.colors.background,
        },
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="register" options={{ title: "Create Account" }} />
    </Stack>
  );
}
