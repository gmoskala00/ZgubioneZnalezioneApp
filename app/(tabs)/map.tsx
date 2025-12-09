import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import MapWithPins, { MapItem } from "../../components/UI/MapWithPins";
import { Api } from "../../services/api";
import { foundItemCategories } from "../../models/FoundItem";
import { CATEGORY_LABELS } from "../../i18n/labels";
import { GlobalStyles } from "../../constants/style";

const MapScreen = () => {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [catsDraft, setCatsDraft] = useState<string[]>([]);
  const [catsApplied, setCatsApplied] = useState<string[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [loadingPins, setLoadingPins] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setRefreshToken((x) => x + 1);
    }, [])
  );

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

  const fetchByBBox = useCallback(
    async (n: number, e: number, s: number, w: number): Promise<MapItem[]> => {
      const res = await Api.listFoundItemsBBox(n, e, s, w, 300, {
        q: query,
        categories: catsApplied,
      });

      return res.items.map((it) => ({
        _id: it._id!,
        title: it.title,
        description: it.description,
        foundLocation: it.foundLocation,
        categories: it.categories,
        dateFound: it.dateFound,
        createdBy: it.createdBy,
      }));
    },
    [query, catsApplied]
  );

  const closeFilters = () => {
    setFiltersOpen(false);
    Keyboard.dismiss();
  };

  return (
    <View style={{ flex: 1 }}>
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

      {filtersOpen && (
        <Pressable onPress={closeFilters} style={styles.backdrop} />
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
              onPress={closeFilters}
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

      <MapWithPins
        fetchByBBox={fetchByBBox}
        refreshToken={refreshToken}
        idleMs={350}
        onLoadingChange={setLoadingPins}
      />
      {loadingPins && (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="small" />
          <Text style={styles.mapLoadingText}>Aktualizuję ogłoszenia...</Text>
        </View>
      )}
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: Platform.select({ ios: 72, android: 72, default: 72 }),
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
    top: Platform.select({ ios: 72, android: 72, default: 72 }),
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
  mapLoading: {
    position: "absolute",
    top: Platform.select({ ios: 120, android: 100, default: 100 }),
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mapLoadingText: {
    fontSize: 12,
    color: "#333",
  },
});
