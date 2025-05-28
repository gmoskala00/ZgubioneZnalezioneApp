import { StyleSheet, View, Text } from "react-native";
import { router } from "expo-router";

import AuthForm from "./AuthForm";
import Button from "../UI/Button";
import { useState } from "react";
import {
  AuthValidationState,
  AuthCredentials,
  LoginCredentials,
} from "../../models/auth";
import Toast from "react-native-toast-message";
import { loginSchema, registerSchema } from "../../shared/schemas/authSchema";

type AuthContentProps = {
  isLogin: boolean;
  onAuthenticate: (credentials: AuthCredentials | LoginCredentials) => void;
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

  function submitHandler(credentials: AuthCredentials | LoginCredentials) {
    const schema = isLogin ? loginSchema : registerSchema;

    const result = schema.safeParse(credentials);
    console.log(result);

    if (!result.success) {
      const fieldErrors = result.error.flatten()
        .fieldErrors as Partial<AuthValidationState>;

      const errorMap: AuthValidationState = {
        username: !!fieldErrors.username,
        email: !!fieldErrors.email,
        password: !!fieldErrors.password,
        confirmPassword: !!fieldErrors.confirmPassword,
        phoneNumber: !!fieldErrors.phoneNumber,
      };

      setCredentialsInvalid(errorMap);

      Toast.show({
        type: "error",
        text1: "Invalid input",
        text2: "Please check your entered credentials.",
      });

      return;
    }

    setCredentialsInvalid({
      username: false,
      email: false,
      password: false,
      confirmPassword: false,
      phoneNumber: false,
    });

    if (isLogin) {
      onAuthenticate(result.data as LoginCredentials);
    } else {
      onAuthenticate(result.data as AuthCredentials);
    }
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
