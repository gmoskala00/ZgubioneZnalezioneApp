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
      >
        <View style={styles.container}>
          <Text style={styles.text}>{children}</Text>
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
  text: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    textAlign: "center",
    color: "white",
  },
  pressed: {
    opacity: 0.75,
  },
});
