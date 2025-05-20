import { StyleSheet, View, Text } from "react-native";
import { Alert } from "react-native";
import { router } from "expo-router";

import AuthForm from "./AuthForm";
import Button from "../UI/Button";
import { useState } from "react";
import { AuthValidationState, AuthCredentials } from "../../models/auth";

type AuthContentProps = {
  isLogin: boolean;
  onAuthenticate: (credentials: AuthCredentials) => void;
};

const AuthContent = ({ isLogin, onAuthenticate }: AuthContentProps) => {
  const [credentialsInvalid, setCredentialsInvalid] =
    useState<AuthValidationState>({
      username: false,
      email: false,
      password: false,
      confirmPassword: false,
      phoneNumber: false,
    });

  const switchAuthModeHandler = () => {
    if (isLogin) {
      router.push("/auth/register");
    } else {
      router.push("/auth/login");
    }
  };

  function submitHandler(credentials: AuthCredentials) {
    let { username, email, password, confirmPassword, phoneNumber } =
      credentials;

    username = username.trim();
    email = email.trim();
    password = password.trim();
    confirmPassword = confirmPassword.trim();
    phoneNumber = phoneNumber?.trim() || "";

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordIsValid = password.length >= 6 && /\d/.test(password);
    const passwordsAreEqual = password === confirmPassword;
    const usernameIsValid =
      isLogin || (username.length >= 3 && !/\s/.test(username));
    const phoneIsValid = !phoneNumber || /^\+?\d{9,15}$/.test(phoneNumber);

    const formIsValid =
      emailIsValid &&
      passwordIsValid &&
      (isLogin || passwordsAreEqual) &&
      (isLogin || usernameIsValid) &&
      phoneIsValid;

    if (!formIsValid) {
      Alert.alert("Invalid input", "Please check your entered credentials.");

      const invalid: AuthValidationState = {
        email: !emailIsValid,
        password: !passwordIsValid,
        confirmPassword: isLogin
          ? false
          : !passwordsAreEqual || !passwordIsValid,
        username: isLogin ? false : !usernameIsValid,
        phoneNumber: !phoneIsValid,
      };

      setCredentialsInvalid(invalid);
      return;
    }
    setCredentialsInvalid({
      username: false,
      email: false,
      password: false,
      confirmPassword: false,
      phoneNumber: false,
    });

    onAuthenticate({ username, email, password, confirmPassword, phoneNumber });
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>{isLogin ? "Login" : "Register"}</Text>
        <AuthForm
          isLogin={isLogin}
          credentialsInvalid={credentialsInvalid}
          onSubmit={submitHandler}
        />
        <Button
          onPress={switchAuthModeHandler}
          mode="flat"
          style={styles.button}
        >
          {isLogin ? "Create an Account" : "Log In instead"}
        </Button>
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
    marginBottom: 25,
    marginHorizontal: 50,
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 64,
    elevation: 16,
    shadowColor: "black",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  title: {
    marginBottom: 24,
    fontSize: 32,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
  },
  button: {
    marginTop: 12,
  },
});
