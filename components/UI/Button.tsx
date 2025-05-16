import { StyleSheet, Text, View, Pressable, ViewStyle } from "react-native";
import { GlobalStyles } from "../../constants/style";

type ButtonProps = {
  children: string;
  onPress: () => void;
  style?: ViewStyle;
};

const Button = ({ children, onPress, style }: ButtonProps) => {
  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      ></Pressable>
      <View style={styles.container}>
        <Text style={styles.text}>{children}</Text>
      </View>
    </View>
  );
};

export default Button;

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: GlobalStyles.colors.primary,
    borderRadius: 6,
  },
  text: {
    fontFamily: "Nunito-Regular",
    fontSize: 14,
    textAlign: "center",
    color: GlobalStyles.colors.textPrimary,
  },
  pressed: {
    opacity: 0.75,
  },
});
