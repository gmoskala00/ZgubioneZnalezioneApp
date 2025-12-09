import { StyleSheet, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/style";

type ActionTileProps = {
  text: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

const ActionTile = ({ text, iconName, onPress }: ActionTileProps) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Ionicons
        name={iconName}
        size={32}
        color={GlobalStyles.colors.primaryDark}
      />
      <Text>{text}</Text>
    </Pressable>
  );
};

export default ActionTile;

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    margin: "1%",
    aspectRatio: 1,
    maxWidth: 150,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    backgroundColor: "white",
  },
  pressed: {
    backgroundColor: GlobalStyles.colors.pressedBackground,
  },
});
