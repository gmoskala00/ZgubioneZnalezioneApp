import { StyleSheet, View } from "react-native";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";

const LoginScreen = () => {
  return (
    <View>
      <Button onPress={() => {}} style={styles.button}>
        Text
      </Button>
      <Input onUpdateValue={() => {}} value="" placeholder="E-mail"></Input>
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
