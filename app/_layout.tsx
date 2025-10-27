import "react-native-reanimated";
import "react-native-gesture-handler";

import { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { AuthContextProvider } from "../store/AuthContext";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/UI/toastConfig";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          "Nunito-Regular": require("../assets/fonts/Nunito-Regular.ttf"),
          "Nunito-Bold": require("../assets/fonts/Nunito-Bold.ttf"),
          "Nunito-Italic": require("../assets/fonts/Nunito-Italic.ttf"),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthContextProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="item/[id]"
              options={{
                presentation: "transparentModal",
                contentStyle: { backgroundColor: "transparent" },
                headerShown: false,
                gestureEnabled: true,
              }}
            />
          </Stack>
          <Toast config={toastConfig} topOffset={75} />
        </GestureHandlerRootView>
      </AuthContextProvider>
    </View>
  );
}
