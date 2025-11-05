import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  Keyboard,
} from "react-native";
import MapView, { Marker, Callout, Region } from "react-native-maps";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { router } from "expo-router";
import * as Location from "expo-location";
import { API_URL } from "../../constants/api";
import { Ionicons } from "@expo/vector-icons";
import { foundItemCategories } from "../../models/FoundItem";
import { CATEGORY_LABELS } from "../../i18n/labels";
import { GlobalStyles } from "../../constants/style";

type FoundItem = {
  _id: string;
  title: string;
  description: string;
  dateFound: string;
  foundLocation: { lat: number; lng: number; description: string };
  categories?: string[];
  status?: "active" | "expired" | "returned";
};

const MapScreen = () => {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);

  // FILTRY
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [catsDraft, setCatsDraft] = useState<string[]>([]);
  const [catsApplied, setCatsApplied] = useState<string[]>([]);

  useEffect(() => {
    const fetchEverything = async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const current = await Location.getCurrentPositionAsync({});
          const userRegion = {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          };
          setRegion(userRegion);
          mapRef.current?.animateToRegion(userRegion, 1000);
        } else {
          setRegion({
            latitude: 52.2297,
            longitude: 21.0122,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          });
        }

        const res = await fetch(`${API_URL}/api/found-items`);
        const data: FoundItem[] = await res.json();
        setItems(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchEverything();
  }, []);

  const filtered = items.filter((it) => {
    if (it.status === "returned" || it.status === "expired") return false;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!it.title.toLowerCase().includes(q)) return false;
    }

    if (catsApplied.length > 0) {
      const itemCats = it.categories ?? [];
      const hasAny = itemCats.some((c) => catsApplied.includes(c));
      if (!hasAny) return false;
    }

    return true;
  });

  if (loading || !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Ładowanie...</Text>
      </View>
    );
  }

  const recenter = async () => {
    try {
      const current = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFilters = () => {
    if (filtersOpen) {
      setFiltersOpen(false);
    } else {
      setCatsDraft(catsApplied);
      setFiltersOpen(true);
      Keyboard.dismiss();
    }
  };

  const toggleDraftCat = (c: string) => {
    setCatsDraft((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const applyCategories = () => {
    setCatsApplied(catsDraft);
    setFiltersOpen(false);
    Keyboard.dismiss();
  };

  const clearAndApply = () => {
    setCatsDraft([]);
    setCatsApplied([]);
    setFiltersOpen(false);
    Keyboard.dismiss();
  };

  const activeCount = (query.trim() ? 1 : 0) + (catsApplied.length > 0 ? 1 : 0);

  // kliknięcie w mapę / tło – zamknij popup i klawiaturę
  const handleMapPress = () => {
    if (filtersOpen) setFiltersOpen(false);
    Keyboard.dismiss();
  };

  return (
    <View style={{ flex: 1 }}>
      {/* top bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color={GlobalStyles.colors.textSecondary}
            style={{ marginHorizontal: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj po tytule..."
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {!!query && (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={10}
              style={{ paddingHorizontal: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={GlobalStyles.colors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={toggleFilters}
          style={({ pressed }) => [
            styles.filterBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="funnel-outline" size={18} color="#fff" />
          <Text style={styles.filterBtnText}>Filtruj</Text>
          {activeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* lekki backdrop żeby klik zamykał popup */}
      {filtersOpen && (
        <Pressable
          onPress={() => {
            setFiltersOpen(false);
            Keyboard.dismiss();
          }}
          style={styles.backdrop}
        />
      )}

      {filtersOpen && (
        <View style={styles.popup}>
          <Text style={styles.popupTitle}>Kategorie</Text>
          <View style={styles.chipsWrap}>
            {foundItemCategories.map((c) => {
              const active = catsDraft.includes(c);
              return (
                <Pressable
                  key={c}
                  onPress={() => toggleDraftCat(c)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.popupFooter}>
            <Pressable
              onPress={clearAndApply}
              style={[styles.footerBtn, styles.footerBtnGhost]}
            >
              <Text style={[styles.footerBtnText, styles.footerBtnGhostText]}>
                Wyczyść
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setFiltersOpen(false);
                Keyboard.dismiss();
              }}
              style={[styles.footerBtn, styles.footerBtnGhost]}
            >
              <Text style={[styles.footerBtnText, styles.footerBtnGhostText]}>
                Anuluj
              </Text>
            </Pressable>
            <Pressable onPress={applyCategories} style={styles.footerBtn}>
              <Text style={styles.footerBtnText}>Zastosuj</Text>
            </Pressable>
          </View>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation
        followsUserLocation={false}
        showsMyLocationButton={false}
        onPress={handleMapPress}
      >
        {filtered.map((it) => (
          <Marker
            key={it._id}
            coordinate={{
              latitude: it.foundLocation.lat,
              longitude: it.foundLocation.lng,
            }}
            title={it.title}
            description={it.foundLocation.description}
            onCalloutPress={() => router.push(`/item/${it._id}`)}
          >
            <Callout tooltip={false}>
              <View style={styles.callout}>
                <Text style={styles.title} numberOfLines={1}>
                  {it.title}
                </Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {it.description}
                </Text>
                <Text style={styles.meta}>
                  Znaleziono:{" "}
                  {dayjs(it.dateFound)
                    .locale("pl")
                    .format("D MMMM YYYY, HH:mm")}
                </Text>
                <View style={[styles.btn, { marginTop: 10 }]}>
                  <Text style={styles.btnText}>Szczegóły</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <Pressable
        onPress={recenter}
        style={({ pressed }) => [
          styles.myLocationBtn,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={{ fontSize: 22 }}>📍</Text>
      </Pressable>

      <View style={styles.osm}>
        <Text style={styles.osmText}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    position: "absolute",
    top: Platform.select({ ios: 74, android: 74, default: 74 }),
    left: 12,
    right: 12,
    zIndex: 30,
    flexDirection: "row",
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
  filterBtn: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: GlobalStyles.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  filterBtnText: { color: "#fff", fontWeight: "600" },
  badge: {
    marginLeft: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: GlobalStyles.colors.primary,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
    backgroundColor: "transparent",
  },
  popup: {
    position: "absolute",
    top: Platform.select({ ios: 120, android: 120, default: 120 }),
    left: 12,
    right: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    zIndex: 40,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    gap: 10,
  },
  popupTitle: { fontSize: 16, fontWeight: "700" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#bbb",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: GlobalStyles.colors.primaryDark,
    borderColor: GlobalStyles.colors.primaryDark,
  },
  chipText: { color: "#333" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  popupFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  footerBtn: {
    backgroundColor: GlobalStyles.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  footerBtnText: { color: "#fff", fontWeight: "600" },
  footerBtnGhost: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
  },
  footerBtnGhostText: {
    color: GlobalStyles.colors.textPrimary,
  },
  callout: {
    width: 260,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 8,
  },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  desc: { color: "#444" },
  meta: { marginTop: 6, fontSize: 12, color: "#666" },
  btn: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  myLocationBtn: {
    position: "absolute",
    bottom: 25,
    right: 15,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 50,
    elevation: 8,
  },
  osm: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "transparent",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  osmText: {
    fontSize: 10,
    color: "#555",
  },
});
