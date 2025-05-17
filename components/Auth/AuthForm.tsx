import { StyleSheet, View } from "react-native";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { useState } from "react";
import { AuthCredentials } from "../../models/auth";

type AuthFormProps = {
  isLogin: boolean;
  credentialsInvalid: {
    username: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
    phoneNumber: boolean;
  };
};

const AuthForm = ({ isLogin, credentialsInvalid }: AuthFormProps) => {
  const [enteredUsername, setEnteredUsername] = useState("");
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState("");
  const [enteredPhoneNumber, setEnteredPhoneNumber] = useState("");

  const {
    username: usernameIsInvalid,
    email: emailIsInvalid,
    password: passwordIsInvalid,
    confirmPassword: passwordsDontMatch,
    phoneNumber: phoneNumberIsInvalid,
  } = credentialsInvalid;

  const updateInputHandler = (
    inputType: keyof AuthCredentials,
    enteredValue: string
  ) => {
    switch (inputType) {
      case "username":
        setEnteredUsername(enteredValue);
        break;
      case "email":
        setEnteredEmail(enteredValue);
        break;
      case "password":
        setEnteredPassword(enteredValue);
        break;
      case "confirmPassword":
        setEnteredConfirmPassword(enteredValue);
        break;
      case "phoneNumber":
        setEnteredPhoneNumber(enteredValue);
        break;
    }
  };

  return (
    <View>
      {!isLogin && (
        <Input
          onUpdateValue={(value) => updateInputHandler("username", value)}
          value={enteredUsername}
          placeholder="Username"
          isInvalid={credentialsInvalid.username}
        ></Input>
      )}
      <Input
        onUpdateValue={(value) => updateInputHandler("email", value)}
        value={enteredEmail}
        placeholder="E-mail"
        isInvalid={credentialsInvalid.email}
        keyboardType="email-address"
      ></Input>
      <Input
        onUpdateValue={(value) => updateInputHandler("password", value)}
        value={enteredPassword}
        placeholder="Password"
        secure
        isInvalid={credentialsInvalid.password}
      ></Input>
      {!isLogin && (
        <Input
          onUpdateValue={(value) =>
            updateInputHandler("confirmPassword", value)
          }
          value={enteredConfirmPassword}
          placeholder="Confim Password"
          secure
          isInvalid={credentialsInvalid.confirmPassword}
        ></Input>
      )}
      {!isLogin && (
        <Input
          onUpdateValue={(value) => updateInputHandler("phoneNumber", value)}
          value={enteredPhoneNumber}
          placeholder="Phone Number (optional)"
          isInvalid={credentialsInvalid.phoneNumber}
          keyboardType="phone-pad"
        ></Input>
      )}
      <Button onPress={() => {}} style={styles.button}>
        {isLogin ? "Log In" : "Sign Up"}
      </Button>
    </View>
  );
};

export default AuthForm;

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
  },
});
