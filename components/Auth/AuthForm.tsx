import { StyleSheet, View } from "react-native";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { useState } from "react";
import {
  AuthCredentials,
  AuthValidationState,
  LoginCredentials,
} from "../../models/auth";

type AuthFormProps = {
  isLogin: boolean;
  credentialsInvalid: AuthValidationState;
  onSubmit: (credentials: AuthCredentials | LoginCredentials) => void;
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
          placeholder="Nazwa użytkownika"
          isInvalid={usernameIsInvalid}
          errorMessage="Nazwa Użytkownika musi być dłuższa niż 3 znaki"
        />
      )}
      <Input
        onUpdateValue={(value) => updateInputHandler("email", value)}
        value={enteredEmail}
        placeholder="E-mail"
        isInvalid={emailIsInvalid}
        keyboardType="email-address"
        errorMessage="Nieprawidłow e-mail"
      />
      <Input
        onUpdateValue={(value) => updateInputHandler("password", value)}
        value={enteredPassword}
        placeholder="Hasło"
        secure
        isInvalid={passwordIsInvalid}
        errorMessage={
          isLogin
            ? "Nieprawidłowe hasło"
            : "Hasło musi zawierać conajmniej 6 znaków i jedną cyfrę"
        }
      />
      {!isLogin && (
        <Input
          onUpdateValue={(value) =>
            updateInputHandler("confirmPassword", value)
          }
          value={enteredConfirmPassword}
          placeholder="Potwierdź hasło"
          secure
          isInvalid={passwordsDontMatch}
          errorMessage="Hasła nie są identyczne"
        />
      )}
      {!isLogin && (
        <Input
          onUpdateValue={(value) => updateInputHandler("phoneNumber", value)}
          value={enteredPhoneNumber}
          placeholder="Numer Telefonu (opcjonalny)"
          isInvalid={phoneNumberIsInvalid}
          keyboardType="phone-pad"
          errorMessage="Numer telefonu nie jest prawdiłowy"
        />
      )}
      <Button onPress={submitHandler} style={styles.button}>
        {isLogin ? "Zaloguj się" : "Rejestracja"}
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
