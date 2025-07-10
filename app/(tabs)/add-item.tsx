import { useState } from "react";
import { StyleSheet, Text, View, TextInput, Button, Alert } from "react-native";
import { useAuth } from "../../store/AuthContext";

const BACKEND_URL = "http://10.0.2.2:5000/api/found-items";

const AddItemScreen = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { token } = useAuth();

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert("Uwaga", "Uzupełnij wszystkie pola");
      return;
    }

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          dateFound: new Date().toISOString(),
          stillHasItem: true,
          contactMethod: "email",
          contactDetails: "example@example.com",
          foundLocation: {
            lat: 0,
            lng: 0,
            description: "Tymczasowa lokalizacja",
          },
          status: "active",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Błąd przy dodawaniu");
      }

      setTitle("");
      setDescription("");
      Alert.alert("Sukces", "Item został dodany!");
    } catch (err: any) {
      console.error("Błąd:", err);
      Alert.alert("Błąd", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tytuł</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Np. Klucze"
      />

      <Text style={styles.label}>Opis</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Np. w tramwaju nr 4"
      />

      <Button title="Dodaj przedmiot" onPress={handleSubmit} />
    </View>
  );
};

export default AddItemScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  label: {
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
  },
});
