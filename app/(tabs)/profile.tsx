import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { Api } from "../../services/api";
import { GlobalStyles } from "../../constants/style";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?\d{9,15}$/;

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    phoneNumber?: string;
  }>({});

  const load = useCallback(async () => {
    try {
      const me = await Api.getMe();
      setUsername(me.username);
      setEmail(me.email);
      setPhoneNumber(me.phoneNumber ?? "");
      setErrors({});
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Błąd profilu",
        text2: e.message || "Nie udało się pobrać profilu.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const validate = () => {
    const next: typeof errors = {};

    if (!username.trim()) {
      next.username = "Podaj nazwę użytkownika.";
    } else if (username.trim().length < 3) {
      next.username = "Minimum 3 znaki.";
    } else if (username.includes(" ")) {
      next.username = "Nazwa nie może zawierać spacji.";
    }

    if (!email.trim()) {
      next.email = "Podaj e-mail.";
    } else if (!emailRegex.test(email.trim())) {
      next.email = "Podaj poprawny adres e-mail.";
    }

    if (phoneNumber.trim()) {
      if (!phoneRegex.test(phoneNumber.trim())) {
        next.phoneNumber = "Podaj numer w formacie +48123456789.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const doSave = async () => {
    setSaving(true);
    try {
      await Api.updateMe({
        username: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      Toast.show({
        type: "success",
        text1: "Zapisano",
        text2: "Twoje dane zostały zaktualizowane.",
      });
    } catch (e: any) {
      const msg =
        e?.message && typeof e.message === "string"
          ? e.message
          : "Nie udało się zapisać zmian.";

      Toast.show({
        type: "error",
        text1: "Błąd zapisu",
        text2: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmSave = () => {
    if (!validate()) {
      Toast.show({
        type: "error",
        text1: "Sprawdź pola",
        text2: "Popraw zaznaczone dane i spróbuj ponownie.",
      });
      return;
    }

    Alert.alert(
      "Zapisać zmiany?",
      "Czy na pewno chcesz zaktualizować dane profilu?",
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Zapisz", style: "default", onPress: doSave },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.accent} />
        <Text style={styles.centerText}>Ładowanie profilu...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: GlobalStyles.colors.background }}
      contentContainerStyle={styles.wrapper}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.screenTitle}>Mój profil</Text>
      <Text style={styles.screenSub}>
        Zarządzaj swoimi danymi kontaktowymi.
      </Text>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>Nazwa użytkownika</Text>
          <TextInput
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              if (errors.username)
                setErrors((p) => ({ ...p, username: undefined }));
            }}
            style={[
              styles.input,
              errors.username && { borderColor: GlobalStyles.colors.error },
            ]}
            placeholder="np. janek99"
            autoCapitalize="none"
          />
          {errors.username ? (
            <Text style={styles.errorText}>{errors.username}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
            style={[
              styles.input,
              errors.email && { borderColor: GlobalStyles.colors.error },
            ]}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="np. ja@przyklad.pl"
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Telefon (opcjonalnie)</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={(t) => {
              setPhoneNumber(t);
              if (errors.phoneNumber)
                setErrors((p) => ({ ...p, phoneNumber: undefined }));
            }}
            style={[
              styles.input,
              errors.phoneNumber && { borderColor: GlobalStyles.colors.error },
            ]}
            keyboardType="phone-pad"
            placeholder="+48123456789"
          />
          {errors.phoneNumber ? (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          ) : (
            <Text style={styles.helpText}>
              Podaj, jeśli chcesz szybciej dogadać przekazanie.
            </Text>
          )}
        </View>

        <Pressable
          onPress={confirmSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.btn,
            (pressed || saving) && { opacity: 0.85 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Zapisz zmiany</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    padding: 32,
    gap: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: "Nunito-Bold",
    color: GlobalStyles.colors.textPrimary,
  },
  screenSub: {
    color: GlobalStyles.colors.textSecondary,
  },
  card: {
    backgroundColor: GlobalStyles.colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    color: GlobalStyles.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    backgroundColor: "#fff",
    borderRadius: 10,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: GlobalStyles.colors.error,
    fontSize: 12,
  },
  helpText: {
    color: GlobalStyles.colors.textSecondary,
    fontSize: 12,
  },
  btn: {
    marginTop: 6,
    backgroundColor: GlobalStyles.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontFamily: "Nunito-Bold", fontSize: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerText: { marginTop: 8, color: GlobalStyles.colors.textSecondary },
});
