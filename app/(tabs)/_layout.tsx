import { Tabs } from "expo-router";
import { Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../store/AuthContext";
import { GlobalStyles } from "../../constants/style";

export default function TabsLayout() {
  const { logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    Alert.alert("Wyloguj się", "Czy jesteś pewien?", [
      { text: "Anuluj", style: "cancel" },
      { text: "Wyloguj", onPress: logout, style: "destructive" },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        headerTintColor: GlobalStyles.colors.textPrimary,
        tabBarActiveTintColor: GlobalStyles.colors.tabActive,
        tabBarInactiveTintColor: GlobalStyles.colors.tabInactive,
        headerRight: () =>
          isAuthenticated && (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginRight: 16 }}
            >
              <Ionicons
                name="log-out-outline"
                size={28}
                color={GlobalStyles.colors.textPrimary}
              />
            </TouchableOpacity>
          ),
        headerTitleContainerStyle: {
          paddingBottom: 8,
        },
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: "bold",
          fontFamily: "Nunito-Bold",
          color: GlobalStyles.colors.textPrimary,
        },
        tabBarStyle: {
          backgroundColor: GlobalStyles.colors.card,
        },
        sceneStyle: {
          backgroundColor: GlobalStyles.colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          title: "Zgubione Znalezione",
          tabBarLabel: "Start",
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
          headerShown: false,
          title: "Mapa",
        }}
      />
      <Tabs.Screen
        name="add-item"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
          title: "Zgubione Znalezione",
          tabBarLabel: "Dodaj",
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
          ),
          title: "Zgubione Znalezione",
          tabBarLabel: "Skrzynka",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          title: "Zgubione Znalezione",
          tabBarLabel: "Profil",
        }}
      />
    </Tabs>
  );
}
