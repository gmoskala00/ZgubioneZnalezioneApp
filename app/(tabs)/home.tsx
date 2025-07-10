import { StyleSheet, Text, View, Image } from "react-native";
import Button from "../../components/UI/Button";
import { useAuth } from "../../store/AuthContext";
import { GlobalStyles } from "../../constants/style";
import ActionTile from "../../components/UI/ActionTile";
import { router } from "expo-router";

const HomeScreen = () => {
  const { userData, logout } = useAuth();

  const mapClickHandle = () => {
    router.push("/map");
  };

  const addClickHandle = () => {
    router.push("/add-item");
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Welcome {userData?.username}!</Text>
      </View>
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/location-search.png")}
          style={styles.image}
        />
      </View>
      <View style={styles.buttonsContainer}>
        <ActionTile
          text="Map"
          iconName="map-outline"
          onPress={mapClickHandle}
        />
        <ActionTile
          text="Add"
          iconName="add-outline"
          onPress={addClickHandle}
        />
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 32,
    fontFamily: "Nunito-Bold",
    color: GlobalStyles.colors.primaryDark,
  },
  imageContainer: {
    flex: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 350,
    height: 270,
  },
  buttonsContainer: {
    flex: 3,
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
    justifyContent: "space-evenly",
  },
});
