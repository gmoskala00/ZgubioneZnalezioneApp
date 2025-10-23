import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Text,
  Platform,
  ActivityIndicator,
} from "react-native";
import MapWithPins, { MapItem } from "../../components/UI/MapWithPins";
import { Api } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import { foundItemCategories } from "../../models/FoundItem";
import { CATEGORY_LABELS } from "../../i18n/labels";
import { GlobalStyles } from "../../constants/style";

export default function MapScreen() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [catsDraft, setCatsDraft] = useState<string[]>([]);
  const [catsApplied, setCatsApplied] = useState<string[]>([]);

  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  const toggleFilters = () => {
    if (filtersOpen) {
      setFiltersOpen(false);
    } else {
      setCatsDraft(catsApplied);
      setFiltersOpen(true);
    }
  };

  const toggleDraftCat = (c: string) => {
    setCatsDraft((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const activeCount = (debouncedQuery ? 1 : 0) + (catsApplied.length ? 1 : 0);

  const fetchByBBox = useMemo(() => {
    return async (n: number, e: number, s: number, w: number) => {
      const opts: { q?: string; categories?: string[] } = {};
      if (debouncedQuery) opts.q = debouncedQuery;
      if (catsApplied.length > 0) opts.categories = catsApplied;

      const res = await Api.listFoundItemsBBox(n, e, s, w, 300, opts);
      return res.items as MapItem[];
    };
  }, [debouncedQuery, catsApplied]);

  const applyCategories = () => {
    setCatsApplied(catsDraft);
    setFiltersOpen(false);
    setRefreshToken((x) => x + 1);
  };

  const clearAndApply = () => {
    setCatsDraft([]);
    setCatsApplied([]);
    setFiltersOpen(false);
    setRefreshToken((x) => x + 1);
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
            clearButtonMode="while-editing"
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
          style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}
          onPress={toggleFilters}
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
              onPress={() => setFiltersOpen(false)}
              style={[
                styles.footerBtn,
                styles.footerBtnGhost,
                { marginRight: "auto" },
              ]}
            >
              <Text style={[styles.footerBtnText, styles.footerBtnGhostText]}>
                Anuluj
              </Text>
            </Pressable>

            <Pressable
              onPress={clearAndApply}
              style={[styles.footerBtn, styles.footerBtnGhost]}
            >
              <Text style={[styles.footerBtnText, styles.footerBtnGhostText]}>
                Wyczyść
              </Text>
            </Pressable>

            <Pressable onPress={applyCategories} style={styles.footerBtn}>
              <Text style={styles.footerBtnText}>Wybierz</Text>
            </Pressable>
          </View>
        </View>
      )}

      <MapWithPins
        fetchByBBox={fetchByBBox}
        idleMs={400}
        refreshToken={refreshToken}
        onLoadingChange={setLoading}
      />

      {loading && (
        <View style={styles.loadingDot}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: Platform.select({ ios: 24, android: 24, default: 24 }),
    left: 12,
    right: 12,
    zIndex: 20,
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
  pressed: { opacity: 0.85 },
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
    zIndex: 21, // nad backdropem
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
    alignItems: "center",
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
  footerBtnGhostText: { color: GlobalStyles.colors.textPrimary },

  loadingDot: {
    position: "absolute",
    top: Platform.select({ ios: 75, android: 75, default: 75 }),
    right: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 30,
  },
});
