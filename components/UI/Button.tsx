import { StyleSheet, Text, View, Pressable, ViewStyle } from "react-native";
import { GlobalStyles } from "../../constants/style";

type ButtonProps = {
  children: string;
  onPress: () => void;
  style?: ViewStyle;
  mode?: string;
};

const Button = ({ children, onPress, style, mode }: ButtonProps) => {
  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={[styles.container, mode === "flat" && styles.flat]}>
          <Text style={[styles.text, mode === "flat" && styles.flatText]}>
            {children}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

export default Button;

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: GlobalStyles.colors.primary,
    borderRadius: 16,
  },
  flat: {
    backgroundColor: "transparent",
  },
  text: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    textAlign: "center",
    color: "white",
  },
  flatText: {
    color: GlobalStyles.colors.textSecondary,
  },
  pressed: {
    opacity: 0.75,
  },
});
