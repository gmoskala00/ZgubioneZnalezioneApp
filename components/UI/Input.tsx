import {
  KeyboardTypeOptions,
  StyleSheet,
  TextInput,
  View,
  Text,
} from "react-native";
import { GlobalStyles } from "../../constants/style";

type InputProps = {
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  secure?: boolean;
  onUpdateValue: (text: string) => void;
  value: string;
  isInvalid?: boolean;
  errorMessage?: string;
};

const Input = ({
  placeholder,
  keyboardType = "default",
  secure = false,
  onUpdateValue,
  value,
  isInvalid = false,
  errorMessage,
}: InputProps) => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, isInvalid && styles.invalidInput]}
        placeholder={placeholder}
        value={value}
        onChangeText={onUpdateValue}
        autoCapitalize="none"
        secureTextEntry={secure}
        keyboardType={keyboardType}
      ></TextInput>
      {isInvalid && (
        <View style={styles.invalidContainer}>
          <Text style={styles.invalidText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  inputContainer: {
    margin: 10,
  },
  input: {
    padding: 12,
    backgroundColor: "white",
    color: GlobalStyles.colors.textPrimary,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    fontSize: 18,
    fontFamily: "Nunito-Regular",
  },
  invalidInput: {
    borderColor: GlobalStyles.colors.error,
  },
  invalidContainer: {
    margin: 2,
  },
  invalidText: {
    color: GlobalStyles.colors.error,
    fontSize: 10,
    fontFamily: "Nunito-Italic",
  },
});
