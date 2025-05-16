import { StyleSheet, Text, View } from "react-native";
import Button from "../../components/UI/Button";

const LoginScreen = () => {
  return (
    <View>
      <Button onPress={() => {}} style={styles.button}>
        Text
      </Button>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  button: {
    width: "50%",
    justifyContent: "center",
  },
});
