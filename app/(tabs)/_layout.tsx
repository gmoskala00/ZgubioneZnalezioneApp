import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTintColor: "black",
        // contentStyle: {
        //   backgroundColor: GlobalStyles.colors.background,
        // },
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen name="add-item" />
      <Tabs.Screen name="home" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="messeges" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
