import { StyleSheet, View, Button } from "react-native";
import AuthForm from "./AuthForm";
import { router } from "expo-router";

type AuthContentProps = {
  isLogin: boolean;
};

const AuthContent = ({ isLogin }: AuthContentProps) => {
  const testinvalids = {
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
    phoneNumber: false,
  };

  const switchAuthModeHandler = () => {
    if (isLogin) {
      router.push("/auth/register");
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <AuthForm isLogin={isLogin} credentialsInvalid={testinvalids} />
        <Button
          title={isLogin ? "Create an Account" : "Log In instead"}
          onPress={switchAuthModeHandler}
        ></Button>
      </View>
    </View>
  );
};

export default AuthContent;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    marginBottom: 200,
    marginHorizontal: 50,
    backgroundColor: "white",
    elevation: 16,
    borderRadius: 64,
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  button: {
    marginTop: 16,
    marginHorizontal: 24,
    justifyContent: "center",
  },
});
