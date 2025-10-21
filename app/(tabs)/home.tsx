// app/(tabs)/home.tsx
import { StyleSheet, Text, View, Image } from "react-native";
import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { useAuth } from "../../store/AuthContext";
import { GlobalStyles } from "../../constants/style";
import ActionTile from "../../components/UI/ActionTile";
import LoadingOverlay from "../../components/UI/LoadingOverlay";
import { router } from "expo-router";

const HomeScreen = () => {
  const { userData } = useAuth();
  const [imageReady, setImageReady] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Asset.fromModule(
          require("../../assets/location-search.png")
        ).downloadAsync();
        if (mounted) setImageReady(true);
      } catch {
        if (mounted) setImageReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (userData && imageReady) setReady(true);
  }, [userData, imageReady]);

  if (!ready) {
    return <LoadingOverlay message="Ładowanie..." />;
  }

  const mapClickHandle = () => router.push("/(tabs)/map");
  const addClickHandle = () => router.push("/(tabs)/add-item");

  return (
    <View style={styles.outerContainer}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Witaj {userData?.username}!</Text>
      </View>
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/location-search.png")}
          style={styles.image}
        />
      </View>
      <View style={styles.buttonsContainer}>
        <ActionTile
          text="Mapa"
          iconName="map-outline"
          onPress={mapClickHandle}
        />
        <ActionTile
          text="Dodaj"
          iconName="add-outline"
          onPress={addClickHandle}
        />
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  textContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: {
    fontSize: 32,
    fontFamily: "Nunito-Bold",
    color: GlobalStyles.colors.primaryDark,
  },
  imageContainer: { flex: 5, justifyContent: "center", alignItems: "center" },
  image: { width: 350, height: 270 },
  buttonsContainer: {
    flex: 3,
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
    justifyContent: "space-evenly",
  },
});
