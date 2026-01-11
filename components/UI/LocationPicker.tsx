import { useRef, useState, useEffect, useCallback } from "react";
import type { ComponentRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Button,
  Alert,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
} from "react-native";
import MapView, {
  Marker,
  MapPressEvent,
  Region,
  UrlTile,
  LongPressEvent,
} from "react-native-maps";
import * as Location from "expo-location";

type Props = {
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  initialRegion?: Region;
  height?: number;
};

type PhotonFeature = {
  geometry: { type: string; coordinates: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    district?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
  };
};

type NominatimItem = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, any>;
};

type Selected = { lat: number; lng: number };

const pickFirst = (...vals: Array<unknown>) =>
  vals.find((v) => v && String(v).trim().length > 0);

const formatAddressSmart = (
  addr: Record<string, any> | undefined,
  displayName?: string
) => {
  const road = pickFirst(
    addr?.road,
    addr?.pedestrian,
    addr?.footway,
    addr?.path,
    addr?.residential
  ) as string | undefined;

  const house = addr?.house_number as string | undefined;
  const city = pickFirst(addr?.city, addr?.town, addr?.village) as
    | string
    | undefined;
  const postcode = addr?.postcode as string | undefined;
  const country = addr?.country as string | undefined;

  const area = pickFirst(
    addr?.neighbourhood,
    addr?.suburb,
    addr?.quarter,
    addr?.city_district,
    addr?.district,
    addr?.borough
  ) as string | undefined;

  const poi = pickFirst(
    addr?.name,
    addr?.amenity,
    addr?.leisure,
    addr?.tourism
  ) as string | undefined;

  const line2 = [postcode, city].filter(Boolean).join(" ").trim() || undefined;

  if (road) {
    const line1 = [road, house].filter(Boolean).join(" ").trim();
    return [line1, line2, country].filter(Boolean).join(", ");
  }

  const head = pickFirst(poi, area) as string | undefined;
  if (head) return [head, line2, country].filter(Boolean).join(", ");

  if (line2) return [line2, country].filter(Boolean).join(", ");

  if (!displayName) return undefined;
  const chunks = displayName
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return chunks.slice(0, Math.min(3, chunks.length)).join(", ");
};

export default function LocationPicker({
  onLocationSelect,
  height = 240,
  initialRegion = {
    latitude: 52.2297,
    longitude: 21.0122,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  },
}: Props) {
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<ComponentRef<typeof Marker> | null>(null);

  const [marker, setMarker] = useState<Selected | null>(null);

  const [address, setAddress] = useState("");
  const [typingQuery, setTypingQuery] = useState("");

  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState<string | undefined>();
  const [addressLoading, setAddressLoading] = useState(false);

  const [locating, setLocating] = useState(true);

  const reverseReqId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLocating(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== "granted") {
          setLocating(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        if (cancelled) return;

        mapRef.current?.animateToRegion(
          {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          600
        );
      } catch (e) {
        console.log("LocationPicker: cannot get user location", e);
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
    setSuggestions([]);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "ZgubioneZnalezione/1.0 (education)" },
      });
      const data = await resp.json();
      return formatAddressSmart(data?.address, data?.display_name);
    } catch {
      return undefined;
    }
  }, []);

  const fetchAutocomplete = useCallback(
    async (q: string): Promise<PhotonFeature[]> => {
      const cleaned = q.trim();
      if (cleaned.length < 3) return [];

      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          cleaned
        )}&limit=10&lang=pl`;
        const res = await fetch(url, {
          headers: { "User-Agent": "ZgubioneZnalezione/1.0 (education)" },
        });
        const data = await res.json();
        const features: PhotonFeature[] = Array.isArray(data.features)
          ? data.features
          : [];
        if (features.length > 0) return features;
      } catch (e) {
        console.log("Photon autocomplete error:", e);
      }

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          cleaned
        )}&limit=10&addressdetails=1`;
        const res = await fetch(url, {
          headers: { "User-Agent": "ZgubioneZnalezione/1.0 (education)" },
        });
        const items: NominatimItem[] = await res.json();

        return (Array.isArray(items) ? items : []).map((it) => ({
          geometry: {
            type: "Point",
            coordinates: [parseFloat(it.lon), parseFloat(it.lat)],
          },
          properties: {
            name: it.display_name,
            city: pickFirst(
              it.address?.city,
              it.address?.town,
              it.address?.village
            ) as string | undefined,
            postcode: it.address?.postcode,
            country: it.address?.country,
            suburb: it.address?.suburb,
            district: it.address?.district,
            neighbourhood: it.address?.neighbourhood,
            city_district: it.address?.city_district,
            street: it.address?.road,
            housenumber: it.address?.house_number,
          },
        }));
      } catch (e) {
        console.log("Nominatim autocomplete error:", e);
        return [];
      }
    },
    []
  );

  useEffect(() => {
    const q = typingQuery.trim();

    if (!dropdownOpen || q.length < 3) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }

    let cancelled = false;
    setLoadingSuggest(true);

    const t = setTimeout(async () => {
      const features = await fetchAutocomplete(q);
      if (cancelled) return;

      const uniq = new Map<string, PhotonFeature>();
      for (const f of features) {
        const p = f.properties || {};
        const label = (p.street || p.name || "").trim();
        const city = (p.city || p.town || p.village || "").trim();
        const country = (p.country || "").trim();
        if (!label) continue;

        const key = `${label}|${city}|${country}`;
        if (!uniq.has(key)) uniq.set(key, f);
      }

      setSuggestions(Array.from(uniq.values()));
      setLoadingSuggest(false);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [typingQuery, dropdownOpen, fetchAutocomplete]);

  const placeMarker = useCallback(
    async (
      lat: number,
      lng: number,
      options?: {
        updateAddress?: boolean;
        overrideAddress?: string;
        moveMap?: boolean;
      }
    ) => {
      const updateAddress = options?.updateAddress ?? false;
      const overrideAddress = options?.overrideAddress;
      const moveMap = options?.moveMap ?? false;

      setMarker({ lat, lng });
      setSelectedAddress(undefined);

      if (moveMap) {
        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          300
        );
      }

      if (overrideAddress) {
        setAddress(overrideAddress);
        setTypingQuery(overrideAddress);
        setSelectedAddress(overrideAddress);
        onLocationSelect?.(lat, lng, overrideAddress);
        requestAnimationFrame(() => markerRef.current?.showCallout?.());
        return;
      }

      if (updateAddress) {
        const reqId = ++reverseReqId.current;
        setAddressLoading(true);

        try {
          const nice = await reverseGeocode(lat, lng);
          if (reqId !== reverseReqId.current) return;

          const finalAddr = nice || undefined;

          if (finalAddr) {
            setAddress(finalAddr);
            setTypingQuery(finalAddr);
          }

          setSelectedAddress(finalAddr);
          onLocationSelect?.(lat, lng, finalAddr);

          if (finalAddr)
            requestAnimationFrame(() => markerRef.current?.showCallout?.());
        } finally {
          // wyłącz spinner nawet jeśli wynik był “stary” / przerwany
          if (reqId === reverseReqId.current) setAddressLoading(false);
        }

        return;
      }

      const fallback = address.trim() || undefined;
      setSelectedAddress(fallback);
      onLocationSelect?.(lat, lng, fallback);
      if (fallback)
        requestAnimationFrame(() => markerRef.current?.showCallout?.());
    },
    [address, onLocationSelect, reverseGeocode]
  );

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    placeMarker(latitude, longitude, { updateAddress: true });
    closeDropdown();
    Keyboard.dismiss();
  };

  const handleMapLongPress = (e: LongPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    placeMarker(latitude, longitude, { updateAddress: true });
    closeDropdown();
    Keyboard.dismiss();
  };

  const handleSearch = async () => {
    const q = address.trim();
    if (!q) {
      Alert.alert("Uwaga", "Wpisz adres (np. ulica, miasto).");
      return;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        q
      )}&limit=1&addressdetails=1`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "ZgubioneZnalezione/1.0 (education)" },
      });
      const data: NominatimItem[] = await resp.json();

      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert(
          "Nie znaleziono",
          "Spróbuj wpisać dokładniej (ulica, numer, miasto)."
        );
        return;
      }

      const item = data[0];
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);

      setAddress(item.display_name);
      setTypingQuery(item.display_name);

      await placeMarker(lat, lng, {
        overrideAddress: item.display_name,
        moveMap: true,
      });

      closeDropdown();
      Keyboard.dismiss();
    } catch {
      Alert.alert("Błąd geokodowania", "Sprawdź połączenie z internetem.");
    }
  };

  const handleSuggestionPress = (s: PhotonFeature) => {
    const p = s.properties || {};

    const street = (p.street || "").trim();
    const housenumber = (p.housenumber || "").trim();
    const city = (p.city || p.town || p.village || "").trim();
    const postcode = (p.postcode || "").trim();
    const country = (p.country || "").trim();

    const area = pickFirst(
      p.neighbourhood,
      p.suburb,
      p.city_district,
      p.district
    ) as string | undefined;

    const line2 = [postcode, city].filter(Boolean).join(" ").trim();

    const head = street
      ? [street, housenumber].filter(Boolean).join(" ").trim()
      : ((p.name || area || "").trim() as string);

    const display = [head, line2, country].filter(Boolean).join(", ").trim();

    const lat = s.geometry.coordinates[1];
    const lng = s.geometry.coordinates[0];

    setAddress(display);
    setTypingQuery(display);

    closeDropdown();
    Keyboard.dismiss();

    placeMarker(lat, lng, { overrideAddress: display, moveMap: true });
  };

  const showSuggestions =
    dropdownOpen && suggestions.length > 0 && typingQuery.trim().length >= 3;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Zaznacz adres *</Text>

      <View style={styles.searchWrap}>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Wpisz adres (np. Królewska 10, Kraków)"
            value={address}
            onChangeText={(v) => {
              setAddress(v);
              setTypingQuery(v);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => {
              setTimeout(() => closeDropdown(), 180);
            }}
            autoCorrect={false}
            autoCapitalize="sentences"
            inputMode="text"
            onSubmitEditing={handleSearch}
          />

          {loadingSuggest && (
            <ActivityIndicator size="small" style={{ marginRight: 4 }} />
          )}

          <Button title="Szukaj" onPress={handleSearch} />
        </View>

        {showSuggestions && (
          <View style={styles.suggestionsBox}>
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {suggestions.map((s, idx) => {
                const p = s.properties || {};
                const street = (p.street || "").trim();
                const housenumber = (p.housenumber || "").trim();
                const city = (p.city || p.town || p.village || "").trim();
                const postcode = (p.postcode || "").trim();
                const country = (p.country || "").trim();

                const area = pickFirst(
                  p.neighbourhood,
                  p.suburb,
                  p.city_district,
                  p.district
                ) as string | undefined;

                const line1 = street
                  ? [street, housenumber].filter(Boolean).join(" ").trim()
                  : ((p.name || area || "Adres") as string);

                const line2 = [postcode, city, country]
                  .filter(Boolean)
                  .join(", ")
                  .trim();

                return (
                  <Pressable
                    key={`${line1}-${line2}-${idx}`}
                    onPress={() => handleSuggestionPress(s)}
                    style={({ pressed }) => [
                      styles.suggestionItem,
                      pressed && { backgroundColor: "#f0f0f0" },
                    ]}
                  >
                    <Text style={styles.suggestionTitle} numberOfLines={1}>
                      {line1}
                    </Text>
                    {!!line2 && (
                      <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                        {line2}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={{ borderRadius: 10, overflow: "hidden" }}>
        <View style={{ width: "100%", height }}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            onLongPress={handleMapLongPress}
          >
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              zIndex={-1}
              // @ts-ignore
              subdomains={["a", "b", "c"]}
            />

            {marker && (
              <Marker
                ref={markerRef}
                coordinate={{ latitude: marker.lat, longitude: marker.lng }}
                title={selectedAddress}
                tracksViewChanges={false}
              />
            )}
          </MapView>

          {locating && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" />
            </View>
          )}
        </View>
      </View>

      {marker && (
        <Text style={styles.coords}>
          {selectedAddress
            ? `📍 ${selectedAddress}`
            : addressLoading
            ? "📍 Ładowanie adresu…"
            : `Lat: ${marker.lat.toFixed(6)} | Lng: ${marker.lng.toFixed(6)}`}
        </Text>
      )}

      <Text style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
        © OpenStreetMap contributors
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8, marginVertical: 10 },
  label: { fontFamily: "Nunito-Bold" },

  searchWrap: {
    position: "relative",
    zIndex: 9999,
    elevation: Platform.OS === "android" ? 9999 : undefined,
  },

  row: { flexDirection: "row", gap: 8, alignItems: "center" },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },

  coords: { marginTop: 6, color: "#555" },

  suggestionsBox: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    maxHeight: 220,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 9999,
    elevation: Platform.OS === "android" ? 9999 : undefined,
  },

  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  suggestionTitle: { fontSize: 14, fontWeight: "600", color: "#222" },
  suggestionSubtitle: { fontSize: 12, color: "#666", marginTop: 2 },

  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
});
