import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { GlobalStyles } from "../../constants/style";

type LoadingOverlayProps = {
  message: string;
};

const LoadingOverlay = ({ message }: LoadingOverlayProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={50}
        color={GlobalStyles.colors.accent}
      ></ActivityIndicator>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.background,
  },
  messageText: {
    margin: 16,
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: GlobalStyles.colors.textPrimary,
  },
});
