// components/FoundItemForm.tsx
import React, { useState } from "react";
import {
  Alert,
  Button,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import LocationPicker from "./location-picker";
import { foundItemCategories } from "../../models/FoundItem";
import { CATEGORY_LABELS, CONTACT_METHOD_LABELS } from "../../i18n/labels";
import { Api } from "../../services/api";
import { formatDateTimePL } from "../../utils/date";

type ContactMethod = "email" | "phone" | "other";

type FoundItemFormProps = {
  onSuccess?: () => void;
};

const FoundItemForm: React.FC<FoundItemFormProps> = ({ onSuccess }) => {
  // wymagane
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // data & czas (na starcie pusto)
  const [dateFound, setDateFound] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false); // iOS: datetime; Android: data
  const [showTimePicker, setShowTimePicker] = useState(false); // Android: czas po dacie
  const [tempAndroidDate, setTempAndroidDate] = useState<Date | null>(null);

  // lokalizacja
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);

  // kategorie + pytania
  const [categories, setCategories] = useState<string[]>([]);
  const [question1, setQuestion1] = useState("");
  const [question2, setQuestion2] = useState("");

  // kontakt
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [contactDetails, setContactDetails] = useState("");

  const toggleCategory = (c: string) =>
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  // ————— pickery daty/czasu —————
  const openDateTimePicker = () => setShowDatePicker(true);

  const onChangeDate = (e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "ios") {
      if (selected) setDateFound(selected); // iOS zwraca pełny lokalny datetime
      if (e.type !== "neutralButtonPressed") setShowDatePicker(false);
      return;
    }
    // Android — krok 1: data
    if (e.type === "set" && selected) {
      setTempAndroidDate(selected);
      setShowDatePicker(false);
      setShowTimePicker(true);
    } else {
      setShowDatePicker(false);
      setTempAndroidDate(null);
    }
  };

  const onChangeTime = (e: DateTimePickerEvent, selected?: Date) => {
    if (e.type === "set" && selected && tempAndroidDate) {
      // Składamy finalną LOKALNĄ datę (bez ręcznego offsetu)
      const finalDate = new Date(
        tempAndroidDate.getFullYear(),
        tempAndroidDate.getMonth(),
        tempAndroidDate.getDate(),
        selected.getHours(),
        selected.getMinutes(),
        0,
        0
      );
      setDateFound(finalDate);
    }
    setShowTimePicker(false);
    setTempAndroidDate(null);
  };

  // ————— walidacja —————
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

  // ————— submit —————
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        dateFound: dateFound!.toISOString(), // backend trzyma UTC
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

      // reset
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

  // ————— UI —————
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Tytuł */}
      <Text style={styles.label}>Tytuł *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Np. Klucze"
      />

      {/* Opis */}
      <Text style={styles.label}>Opis *</Text>
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Np. znalezione w tramwaju nr 4"
        multiline
      />

      {/* Data i czas */}
      <Text style={styles.label}>Data i czas znalezienia *</Text>
      <Button title="Wybierz datę i czas" onPress={openDateTimePicker} />
      {dateFound && (
        <Text style={{ marginTop: 8, color: "#555" }}>
          Wybrano: {formatDateTimePL(dateFound)}
        </Text>
      )}

      {/* iOS: datetime */}
      {Platform.OS === "ios" && showDatePicker && (
        <DateTimePicker
          value={dateFound ?? new Date()}
          mode="datetime"
          display="spinner"
          onChange={onChangeDate}
        />
      )}

      {/* Android: data → czas */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={tempAndroidDate ?? dateFound ?? new Date()}
          mode="date"
          onChange={onChangeDate}
        />
      )}
      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={dateFound ?? new Date()}
          mode="time"
          onChange={onChangeTime}
        />
      )}

      {/* Lokalizacja */}
      <LocationPicker
        onLocationSelect={(lat: number, lng: number, addr?: string) => {
          setLocation({ lat, lng, address: addr });
        }}
      />

      {/* Kategorie */}
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

      {/* Pytania weryfikacyjne */}
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

      {/* Kontakt */}
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
      <Button title="Dodaj przedmiot" onPress={handleSubmit} />
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
