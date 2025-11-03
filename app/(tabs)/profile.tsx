import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { Api } from "../../services/api";
import { GlobalStyles } from "../../constants/style"; // jeśli masz taki plik
import type { UserData } from "../../models/auth"; // to masz u siebie

const ProfileScreen = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // lokalne pola
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const me = await Api.getMe();
        setUser(me);
        setUsername(me.username);
        setEmail(me.email);
        setPhoneNumber(me.phoneNumber ?? "");
      } catch (e: any) {
        Alert.alert("Błąd", e.message || "Nie udało się pobrać profilu");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await Api.updateMe({
        username,
        email,
        phoneNumber,
      });
      setUser(updated);
      Alert.alert("Zapisano", "Dane profilu zostały zaktualizowane.");
    } catch (e: any) {
      Alert.alert("Błąd", e.message || "Nie udało się zapisać zmian.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.accent} />
        <Text
          style={{ marginTop: 8, color: GlobalStyles.colors.textSecondary }}
        >
          Ładowanie profilu...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: GlobalStyles.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Mój profil</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nazwa użytkownika</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          placeholder="Twoja nazwa"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Telefon</Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.input}
          keyboardType="phone-pad"
          placeholder="+48123456789"
        />
      </View>

      <Pressable
        onPress={save}
        disabled={saving}
        style={({ pressed }) => [
          styles.btn,
          (pressed || saving) && { opacity: 0.8 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Zapisz zmiany</Text>
        )}
      </Pressable>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    color: GlobalStyles.colors.textPrimary,
  },
  field: {
    gap: 6,
  },
  label: {
    fontWeight: "600",
    color: GlobalStyles.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    backgroundColor: GlobalStyles.colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btn: {
    marginTop: 20,
    backgroundColor: GlobalStyles.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
