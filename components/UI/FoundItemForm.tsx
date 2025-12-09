import React, { useState, useEffect } from "react";
import { useAuth } from "../../store/AuthContext";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import Button from "./Button";
import LocationPicker from "./LocationPicker";
import { foundItemCategories } from "../../models/FoundItem";
import { CATEGORY_LABELS, CONTACT_METHOD_LABELS } from "../../i18n/labels";
import { Api } from "../../services/api";

type ContactMethod = "email" | "phone" | "other";

type FoundItemFormProps = {
  onSuccess?: () => void;
};

const FoundItemForm: React.FC<FoundItemFormProps> = ({ onSuccess }) => {
  const { userData } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [dateFound, setDateFound] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [tempIosDate, setTempIosDate] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [question1, setQuestion1] = useState("");
  const [question2, setQuestion2] = useState("");

  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [contactDetails, setContactDetails] = useState("");

  useEffect(() => {
    if (contactMethod === "email") {
      setContactDetails(userData?.email || "");
    } else if (contactMethod === "phone") {
      setContactDetails(userData?.phoneNumber || "");
    } else {
      setContactDetails("");
    }
  }, [contactMethod, userData]);

  const clampToNow = (d: Date) => {
    const now = new Date();
    return d.getTime() > now.getTime() ? now : d;
  };

  const toggleCategory = (c: string) =>
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const validate = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Uwaga", "Uzupełnij tytuł i opis.");
      return false;
    }
    if (!dateFound) {
      Alert.alert("Uwaga", "Wybierz datę i czas znalezienia.");
      return false;
    }
    if (!location) {
      Alert.alert("Uwaga", "Zaznacz lokalizację na mapie lub wyszukaj adres.");
      return false;
    }
    if (categories.length < 1) {
      Alert.alert("Uwaga", "Wybierz co najmniej jedną kategorię.");
      return false;
    }
    if (!question1.trim() || !question2.trim()) {
      Alert.alert("Uwaga", "Podaj dwa pytania weryfikacyjne.");
      return false;
    }
    if (question1.trim() === question2.trim()) {
      Alert.alert("Uwaga", "Pytania muszą się różnić.");
      return false;
    }
    if (!contactDetails.trim()) {
      Alert.alert("Uwaga", "Podaj dane kontaktowe.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        dateFound: dateFound!.toISOString(),
        foundLocation: {
          lat: location!.lat,
          lng: location!.lng,
          description: location?.address || "Zaznaczone na mapie",
        },
        categories,
        securityQuestions: [question1.trim(), question2.trim()] as [
          string,
          string
        ],
        contactMethod,
        contactDetails: contactDetails.trim(),
      };

      await Api.createFoundItem(body);

      setTitle("");
      setDescription("");
      setDateFound(null);
      setLocation(null);
      setCategories([]);
      setQuestion1("");
      setQuestion2("");
      setContactMethod("email");
      setContactDetails("");

      Alert.alert("Sukces", "Przedmiot został dodany!");
      onSuccess?.();
    } catch (err: any) {
      if (err?.message === "Unauthorized") {
        Alert.alert("Sesja wygasła", "Zaloguj się ponownie.");
        return;
      }
      console.error(err);
      Alert.alert("Błąd", err?.message || "Coś poszło nie tak");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Tytuł *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Np. Klucze"
      />

      <Text style={styles.label}>Opis *</Text>
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Np. znalezione w tramwaju nr 4"
        multiline
      />

      <Text style={styles.label}>Data i czas znalezienia *</Text>

      {Platform.OS === "ios" ? (
        <>
          {!showDatePicker ? (
            <Button
              onPress={() => {
                setTempIosDate(dateFound ?? new Date());
                setShowDatePicker(true);
              }}
            >
              Wybierz datę i czas
            </Button>
          ) : (
            <View style={{ gap: 8 }}>
              <DateTimePicker
                value={tempIosDate}
                mode="datetime"
                display="spinner"
                locale="pl-PL"
                onChange={(_, selected) => {
                  if (!selected) return;
                  const safe = clampToNow(selected);
                  setTempIosDate(safe);
                }}
              />
              <Pressable
                onPress={() => {
                  setDateFound(tempIosDate);
                  setShowDatePicker(false);
                }}
                style={{ alignSelf: "flex-end", padding: 6 }}
              >
                <Text style={{ color: "#007AFF" }}>Gotowe</Text>
              </Pressable>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button onPress={() => setShowDatePicker(true)}>
              Wybierz datę
            </Button>
            <Button
              onPress={() => {
                if (!dateFound) {
                  Alert.alert("Uwaga", "Najpierw wybierz datę.");
                  return;
                }
                setShowTimePicker(true);
              }}
            >
              Wybierz godzinę
            </Button>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dateFound ?? new Date()}
              mode="date"
              onChange={(e, selected) => {
                if (e.type === "dismissed") {
                  setShowDatePicker(false);
                  return;
                }
                if (selected) {
                  const safe = clampToNow(selected);
                  setDateFound((prev) => {
                    const base = prev ?? safe;
                    return new Date(
                      safe.getFullYear(),
                      safe.getMonth(),
                      safe.getDate(),
                      base.getHours(),
                      base.getMinutes(),
                      0,
                      0
                    );
                  });
                }
                setShowDatePicker(false);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={dateFound ?? new Date()}
              mode="time"
              onChange={(e, selected) => {
                if (e.type === "dismissed") {
                  setShowTimePicker(false);
                  return;
                }
                if (selected) {
                  const safe = clampToNow(selected);
                  setDateFound((prev) => {
                    const base = prev ?? new Date();
                    return new Date(
                      base.getFullYear(),
                      base.getMonth(),
                      base.getDate(),
                      safe.getHours(),
                      safe.getMinutes(),
                      0,
                      0
                    );
                  });
                }
                setShowTimePicker(false);
              }}
            />
          )}
        </>
      )}

      {dateFound && (
        <Text style={{ marginTop: 8, color: "#555" }}>
          Wybrano: {dayjs(dateFound).format("D MMMM YYYY HH:mm")}
        </Text>
      )}

      <LocationPicker
        onLocationSelect={(lat: number, lng: number, addr?: string) => {
          setLocation({ lat, lng, address: addr });
        }}
      />

      <Text style={[styles.label, { marginTop: 8 }]}>Kategorie *</Text>
      <View style={styles.chipsWrap}>
        {foundItemCategories.map((c) => {
          const active = categories.includes(c);
          return (
            <Pressable
              key={c}
              onPress={() => toggleCategory(c)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Pytanie 1 *</Text>
      <TextInput
        style={styles.input}
        value={question1}
        onChangeText={setQuestion1}
        placeholder="Np. jaki kolor jest breloka?"
      />
      <Text style={styles.label}>Pytanie 2 *</Text>
      <TextInput
        style={styles.input}
        value={question2}
        onChangeText={setQuestion2}
        placeholder="Np. ile kluczy było na kółku?"
      />

      <Text style={[styles.label, { marginTop: 8 }]}>Metoda kontaktu</Text>
      <View style={styles.segment}>
        {(["email", "phone", "other"] as const).map((m) => (
          <Text
            key={m}
            onPress={() => setContactMethod(m)}
            style={[
              styles.segmentItem,
              contactMethod === m && styles.segmentItemActive,
            ]}
          >
            {CONTACT_METHOD_LABELS[m]}
          </Text>
        ))}
      </View>

      <Text style={styles.label}>
        Dane kontaktowe{" "}
        {contactMethod === "email"
          ? "(e-mail)"
          : contactMethod === "phone"
          ? "(telefon)"
          : "(np. Messenger)"}{" "}
        *
      </Text>
      <TextInput
        style={styles.input}
        value={contactDetails}
        onChangeText={setContactDetails}
        placeholder={
          contactMethod === "email"
            ? "jan.kowalski@example.com"
            : contactMethod === "phone"
            ? "500 600 700"
            : "FB: Jan Kowalski"
        }
        autoCapitalize={contactMethod === "email" ? "none" : "sentences"}
        keyboardType={contactMethod === "phone" ? "phone-pad" : "default"}
      />

      <View style={{ height: 12 }} />
      <Button onPress={handleSubmit}>Dodaj przedmiot</Button>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

export default FoundItemForm;

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  label: { fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  segment: { flexDirection: "row", gap: 8 },
  segmentItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bbb",
    color: "#333",
  },
  segmentItemActive: {
    backgroundColor: "#333",
    color: "#fff",
    borderColor: "#333",
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#bbb",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipActive: { backgroundColor: "#333", borderColor: "#333" },
  chipText: { color: "#333" },
  chipTextActive: { color: "#fff" },
});
