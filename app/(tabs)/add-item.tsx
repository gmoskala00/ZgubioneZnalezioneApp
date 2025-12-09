import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import FoundItemForm from "../../components/UI/FoundItemForm";

export default function AddItemScreen() {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FoundItemForm />
    </KeyboardAvoidingView>
  );
}
