import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { Api } from "./api";

export async function registerForPushNotificationsAsync() {
  if (!Constants.isDevice) {
    console.log("Not a real device, no push token.");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: "2f2d8e6c-6ed5-4f2a-9d88-bc0bb4a1f3e1",
  });

  console.log("EXPO TOKEN ==> ", token);

  try {
    await Api.post("/api/users/push-token", { token });
  } catch (e) {
    console.log("push token send error", e);
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}
