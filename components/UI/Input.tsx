import { KeyboardTypeOptions, StyleSheet, TextInput, View } from "react-native";
import { GlobalStyles } from "../../constants/style";

type InputProps = {
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  secure?: boolean;
  onUpdateValue: (text: string) => void;
  value: string;
  isInvalid?: boolean;
};

const Input = ({
  placeholder,
  keyboardType = "default",
  secure = false,
  onUpdateValue,
  value,
  isInvalid = false,
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
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  inputContainer: {
    margin: 8,
  },
  input: {
    padding: 16,
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
});
