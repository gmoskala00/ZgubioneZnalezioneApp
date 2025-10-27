import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { Api } from "../../services/api";

type FoundItem = {
  _id: string;
  title: string;
  description: string;
  dateFound: string;
  foundLocation: { lat: number; lng: number; description: string };
  categories: string[];
  securityQuestions: [string, string];
  contactMethod: "email" | "phone" | "other";
  contactDetails: string;
  status?: string;
  createdAt?: string;
};

const ItemDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<FoundItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [ans1, setAns1] = useState("");
  const [ans2, setAns2] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await Api.get<FoundItem>(`/api/found-items/${id}`);
        setItem(data);
      } catch (e) {
        console.error(e);
        Alert.alert("Błąd", "Nie udało się pobrać ogłoszenia.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const submitAnswers = async () => {
    if (!ans1.trim() || !ans2.trim()) {
      Alert.alert("Uwaga", "Uzupełnij obie odpowiedzi.");
      return;
    }
    try {
      const data = await Api.post(`/api/found-items/${id}/answers`, {
        answers: [ans1.trim(), ans2.trim()],
      });
      Alert.alert("Wysłano", data?.message || "Odpowiedź została zapisana.");
      setAns1("");
      setAns2("");
    } catch (e: any) {
      Alert.alert("Błąd", e.message || "Coś poszło nie tak");
    }
  };

  if (loading || !item) {
    return (
      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text>Brak danych</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>
        Znaleziono:{" "}
        {dayjs(item.dateFound).locale("pl").format("D MMMM YYYY, HH:mm")}
      </Text>
      <Text style={styles.location}>📍 {item.foundLocation.description}</Text>

      {!!item.categories?.length && (
        <View style={styles.tagsWrap}>
          {item.categories.map((c) => (
            <View key={c} style={styles.tag}>
              <Text style={styles.tagText}>{c}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Opis</Text>
      <Text style={styles.desc}>{item.description}</Text>

      <Text style={styles.sectionTitle}>Weryfikacja</Text>
      <Text style={styles.q}>{item.securityQuestions?.[0]}</Text>
      <TextInput
        style={styles.input}
        value={ans1}
        onChangeText={setAns1}
        placeholder="Twoja odpowiedź"
      />
      <Text style={styles.q}>{item.securityQuestions?.[1]}</Text>
      <TextInput
        style={styles.input}
        value={ans2}
        onChangeText={setAns2}
        placeholder="Twoja odpowiedź"
      />

      <Pressable
        onPress={submitAnswers}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.btnText}>Wyślij odpowiedzi</Text>
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.linkText}>⟵ Wróć do mapy</Text>
      </Pressable>
    </ScrollView>
  );
};

export default ItemDetailsScreen;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: "bold" },
  meta: { color: "#666" },
  location: { marginTop: 6, color: "#333" },
  sectionTitle: { marginTop: 12, fontWeight: "bold" },
  desc: { color: "#333" },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  tag: {
    backgroundColor: "#eee",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  tagText: { color: "#333", fontSize: 12 },
  q: { marginTop: 8, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  btn: {
    marginTop: 12,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  link: { marginTop: 12, alignItems: "center" },
  linkText: { color: "#156541", fontWeight: "600" },
});
