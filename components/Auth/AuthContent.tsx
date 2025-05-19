import { StyleSheet, View } from "react-native";
import { Alert } from "react-native";
import { router } from "expo-router";

import AuthForm from "./AuthForm";
import Button from "../UI/Button";
import { useState } from "react";
import { AuthValidationState, AuthCredentials } from "../../models/auth";

type AuthContentProps = {
  isLogin: boolean;
};

const AuthContent = ({ isLogin }: AuthContentProps) => {
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

    // onAuthenticate({ username, email, password, confirmPassword, phoneNumber });
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
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
    marginBottom: 200,
    marginHorizontal: 50,
    backgroundColor: "white",
    elevation: 16,
    borderRadius: 64,
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  button: {
    marginTop: 8,
  },
});
