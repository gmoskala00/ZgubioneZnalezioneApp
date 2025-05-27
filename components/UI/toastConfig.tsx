import { BaseToast, ErrorToast } from "react-native-toast-message";
import { GlobalStyles } from "../../constants/style";

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: GlobalStyles.colors.primary,
        backgroundColor: GlobalStyles.colors.card,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: GlobalStyles.colors.textPrimary,
        fontFamily: "Nunito-Bold",
      }}
      text2Style={{
        fontSize: 14,
        color: GlobalStyles.colors.textSecondary,
        fontFamily: "Nunito-Regular",
      }}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: GlobalStyles.colors.error,
        backgroundColor: GlobalStyles.colors.card,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: GlobalStyles.colors.error,
        fontFamily: "Nunito-Bold",
      }}
      text2Style={{
        fontSize: 14,
        color: GlobalStyles.colors.textSecondary,
        fontFamily: "Nunito-Regular",
      }}
    />
  ),

  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: GlobalStyles.colors.accent,
        backgroundColor: GlobalStyles.colors.card,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: GlobalStyles.colors.textPrimary,
        fontFamily: "Nunito-Bold",
      }}
      text2Style={{
        fontSize: 14,
        color: GlobalStyles.colors.textSecondary,
        fontFamily: "Nunito-Regular",
      }}
    />
  ),
};
