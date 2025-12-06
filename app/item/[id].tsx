import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Api } from "../../services/api";
import { CATEGORY_LABELS } from "../../i18n/labels";

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

const ItemDetailsModal = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<FoundItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [ans1, setAns1] = useState("");
  const [ans2, setAns2] = useState("");
  const [extraMsg, setExtraMsg] = useState(""); // 👈 NEW
  const [submitting, setSubmitting] = useState(false);

  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "92%"], []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await Api.get<FoundItem>(`/api/found-items/${id}`);
        setItem(data);
      } catch (e) {
        console.error(e);
        Alert.alert("Błąd", "Nie udało się pobrać ogłoszenia.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const close = useCallback(() => router.back(), []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const submitAnswers = async () => {
    if (!ans1.trim() || !ans2.trim()) {
      Alert.alert("Uwaga", "Uzupełnij obie odpowiedzi.");
      return;
    }
    try {
      setSubmitting(true);
      const payload: {
        answers: [string, string];
        message?: string;
      } = {
        answers: [ans1.trim(), ans2.trim()],
      };

      if (extraMsg.trim()) {
        payload.message = extraMsg.trim();
      }

      const data = await Api.post(`/api/claims/${id}`, payload);
      Alert.alert("Wysłano", data?.message || "Odpowiedź została zapisana.");
      setAns1("");
      setAns2("");
      setExtraMsg("");
      close();
    } catch (e: any) {
      Alert.alert("Błąd", e.message || "Coś poszło nie tak");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.overlay, { paddingTop: insets.top }]}>
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={close}
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="fillParent"
        handleIndicatorStyle={{ backgroundColor: "#E1E1E1" }}
        backgroundStyle={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: 16 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.titleTop} numberOfLines={1}>
              {item?.title || "Szczegóły"}
            </Text>
            <Pressable onPress={close} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          ) : !item ? (
            <View style={styles.center}>
              <Text>Brak danych</Text>
            </View>
          ) : (
            <>
              <Text style={styles.meta}>
                Znaleziono:{" "}
                {dayjs(item.dateFound)
                  .locale("pl")
                  .format("D MMMM YYYY, HH:mm")}
              </Text>
              <Text style={styles.location}>
                📍 {item.foundLocation.description}
              </Text>

              {!!item.categories?.length && (
                <View style={styles.tagsWrap}>
                  {item.categories.map((c) => (
                    <View key={c} style={styles.tag}>
                      <Text style={styles.tagText}>
                        {CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] ??
                          c}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sectionTitle}>Opis</Text>
              <Text style={styles.desc}>{item.description}</Text>

              <Text style={styles.sectionTitle}>Weryfikacja</Text>
              <Text style={styles.q}>
                {item.securityQuestions?.[0] ?? "Pytanie 1"}
              </Text>
              <BottomSheetTextInput
                style={styles.input}
                value={ans1}
                onChangeText={setAns1}
                placeholder="Twoja odpowiedź"
                returnKeyType="next"
              />
              <Text style={styles.q}>
                {item.securityQuestions?.[1] ?? "Pytanie 2"}
              </Text>
              <BottomSheetTextInput
                style={styles.input}
                value={ans2}
                onChangeText={setAns2}
                placeholder="Twoja odpowiedź"
                returnKeyType="next"
              />

              <Text style={styles.sectionTitle}>Dodatkowa wiadomość</Text>
              <BottomSheetTextInput
                style={[styles.input, styles.multiline]}
                value={extraMsg}
                onChangeText={setExtraMsg}
                multiline
                numberOfLines={4}
                placeholder="Dodaj opcjonalny opis, by znalazca miał pewność, że to Twoje"
              />

              <Pressable
                onPress={submitAnswers}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.btn,
                  (pressed || submitting) && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.btnText}>
                  {submitting ? "Wysyłanie..." : "Wyślij odpowiedzi"}
                </Text>
              </Pressable>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
};

export default ItemDetailsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  container: { paddingHorizontal: 16, gap: 10 },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 6,
  },
  closeBtn: { position: "absolute", right: 6, top: 0, padding: 8 },
  closeText: { fontSize: 18, color: "#333" },
  titleTop: {
    fontSize: 18,
    fontWeight: "700",
    maxWidth: "70%",
    textAlign: "center",
  },
  center: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
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
  multiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  btn: {
    marginTop: 12,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});
