export async function sendExpoPush(
  expoToken: string,
  title: string,
  body: string,
  data?: any
) {
  console.log("sendExpoPush ->", expoToken, title);

  if (!expoToken.startsWith("ExponentPushToken")) {
    console.log("invalid expo token");
    return;
  }

  const resp = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: expoToken,
      sound: "default",
      title,
      body,
      data,
    }),
  });

  const json = await resp.json();
  console.log("expo response", json);
}
