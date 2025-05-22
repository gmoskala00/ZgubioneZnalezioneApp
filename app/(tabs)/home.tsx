import { StyleSheet, Text, View } from "react-native";
import Button from "../../components/UI/Button";
import { router } from "expo-router";

const HomeScreen = () => {
  return (
    <View>
      <Text>home</Text>
      <Button
        onPress={() => {
          router.replace("/auth/login");
        }}
      >
        BACK
      </Button>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
