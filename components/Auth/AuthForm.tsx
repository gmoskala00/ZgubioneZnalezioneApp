import { StyleSheet, View } from "react-native";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { useState } from "react";
import { AuthCredentials, AuthValidationState } from "../../models/auth";

type AuthFormProps = {
  isLogin: boolean;
  credentialsInvalid: AuthValidationState;
  onSubmit: (credentials: AuthCredentials) => void;
};

const AuthForm = ({ isLogin, credentialsInvalid, onSubmit }: AuthFormProps) => {
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

  const submitHandler = () => {
    onSubmit({
      username: enteredUsername,
      email: enteredEmail,
      password: enteredPassword,
      confirmPassword: enteredConfirmPassword,
      phoneNumber: enteredPhoneNumber,
    });
  };

  return (
    <View>
      {!isLogin && (
        <Input
          onUpdateValue={(value) => updateInputHandler("username", value)}
          value={enteredUsername}
          placeholder="Username"
          isInvalid={usernameIsInvalid}
          errorMessage="Username must be longer than 3 characters"
        />
      )}
      <Input
        onUpdateValue={(value) => updateInputHandler("email", value)}
        value={enteredEmail}
        placeholder="E-mail"
        isInvalid={emailIsInvalid}
        keyboardType="email-address"
        errorMessage="Invalid e-mail"
      />
      <Input
        onUpdateValue={(value) => updateInputHandler("password", value)}
        value={enteredPassword}
        placeholder="Password"
        secure
        isInvalid={passwordIsInvalid}
        errorMessage={
          isLogin
            ? "Invalid Password"
            : "Password must contain 6 characters and one number"
        }
      />
      {!isLogin && (
        <Input
          onUpdateValue={(value) =>
            updateInputHandler("confirmPassword", value)
          }
          value={enteredConfirmPassword}
          placeholder="Confim Password"
          secure
          isInvalid={passwordsDontMatch}
          errorMessage="Passwords do not match"
        />
      )}
      {!isLogin && (
        <Input
          onUpdateValue={(value) => updateInputHandler("phoneNumber", value)}
          value={enteredPhoneNumber}
          placeholder="Phone Number (optional)"
          isInvalid={phoneNumberIsInvalid}
          keyboardType="phone-pad"
          errorMessage="Phone Number is not correct"
        />
      )}
      <Button onPress={submitHandler} style={styles.button}>
        {isLogin ? "Log In" : "Register"}
      </Button>
    </View>
  );
};

export default AuthForm;

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
    marginHorizontal: 32,
  },
});
