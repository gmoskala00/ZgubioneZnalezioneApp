import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { Api } from "./api";

export async function registerForPushNotificationsAsync() {
  //   console.log("Platform.OS =", Platform.OS);
  //   console.log("Device.isDevice =", Device.isDevice);
  if (!Device.isDevice) {
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
    projectId: "0b740d48-7407-456f-a0c5-1d6974e67541",
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
