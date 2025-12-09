import { useRef, useState, useEffect } from "react";
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
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    district?: string;
    suburb?: string;
  };
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
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>();

  const [typingQuery, setTypingQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({});
        if (cancelled) return;

        const userRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        mapRef.current?.animateToRegion(userRegion, 600);
      } catch (e) {
        console.log("LocationPicker: cannot get user location", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "User-Agent": "ZgubioneZnalezione/1.0 (education)" } }
      );
      const data = await resp.json();
      const addr = data?.address;

      if (!addr) return data?.display_name as string | undefined;

      const parts = [
        addr.road,
        addr.house_number,
        addr.suburb || addr.district,
        addr.city || addr.town || addr.village,
        addr.postcode,
        addr.country,
      ].filter(Boolean);

      return parts.join(", ");
    } catch {
      return undefined;
    }
  };

  const geocodeSingle = async (query: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query
    )}&limit=1`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "ZgubioneZnalezione/1.0 (education)" },
    });
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const item = data[0];
    return {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display: item.display_name as string,
    };
  };

  const placeMarker = async (
    lat: number,
    lng: number,
    options?: { updateAddress?: boolean; overrideAddress?: string }
  ) => {
    const { updateAddress = false, overrideAddress } = options || {};
    setMarker({ lat, lng });

    if (overrideAddress) {
      setSelectedAddress(overrideAddress);
      onLocationSelect?.(lat, lng, overrideAddress);
      return;
    }

    if (updateAddress) {
      const display = await reverseGeocode(lat, lng);
      setSelectedAddress(display);
      onLocationSelect?.(lat, lng, display);
    } else {
      setSelectedAddress(address || undefined);
      onLocationSelect?.(lat, lng, address || undefined);
    }
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    placeMarker(latitude, longitude, { updateAddress: true });
    Keyboard.dismiss();
    setInputFocused(false);
    setSuggestions([]);
  };

  const handleMapLongPress = (e: LongPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    placeMarker(latitude, longitude, { updateAddress: true });
    Keyboard.dismiss();
    setInputFocused(false);
    setSuggestions([]);
  };

  const handleSearch = async () => {
    const q = address.trim();
    if (!q) {
      Alert.alert("Uwaga", "Wpisz adres (np. ulica, miasto).");
      return;
    }

    if (suggestions.length > 0) {
      handleSuggestionPress(suggestions[0]);
      return;
    }

    try {
      const res = await geocodeSingle(q);
      if (!res) {
        Alert.alert(
          "Nie znaleziono",
          "Spróbuj wpisać dokładniej (ulica, numer, miasto)."
        );
        return;
      }
      setAddress(res.display);
      setTypingQuery(res.display);

      await placeMarker(res.lat, res.lng, { overrideAddress: res.display });
      mapRef.current?.animateToRegion(
        {
          latitude: res.lat,
          longitude: res.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        300
      );
      Keyboard.dismiss();
      setInputFocused(false);
      setSuggestions([]);
    } catch {
      Alert.alert("Błąd geokodowania", "Sprawdź połączenie z internetem.");
    }
  };

  useEffect(() => {
    const q = typingQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }

    setLoadingSuggest(true);

    const timeout = setTimeout(async () => {
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          q
        )}&limit=10&lang=en`; // <= LANG = EN
        const res = await fetch(url, {
          headers: { "User-Agent": "ZgubioneZnalezione/1.0 (education)" },
        });
        const data = await res.json();
        const features: PhotonFeature[] = Array.isArray(data.features)
          ? data.features
          : [];

        const uniq = new Map<string, PhotonFeature>();
        for (const f of features) {
          const p = f.properties || {};
          const label = p.name || p.street || "";
          const city = p.city || p.town || p.village || "";
          const country = p.country || "";
          const key = `${label}|${city}|${country}`;
          if (!label) continue;
          if (!uniq.has(key)) uniq.set(key, f);
        }

        setSuggestions(Array.from(uniq.values()));
      } catch (e) {
        console.log("autocomplete error:", e);
      } finally {
        setLoadingSuggest(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [typingQuery]);

  const handleSuggestionPress = (s: PhotonFeature) => {
    const p = s.properties || {};
    const label = p.name || p.street || "";
    const housenumber = p.housenumber || "";
    const city = p.city || p.town || p.village || "";
    const postcode = p.postcode || "";
    const country = p.country || "";
    const secondary = [city, postcode, country].filter(Boolean).join(", ");

    const display = secondary ? `${label} ${housenumber}, ${secondary}` : label;

    const lat = s.geometry.coordinates[1];
    const lng = s.geometry.coordinates[0];

    setAddress(display);
    setTypingQuery(display);
    setSuggestions([]);
    Keyboard.dismiss();
    setInputFocused(false);

    placeMarker(lat, lng, { overrideAddress: display });
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      300
    );
  };

  const shouldShowSuggestions =
    inputFocused && suggestions.length > 0 && typingQuery.trim().length >= 3;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Wyszukaj adres</Text>

      {/* Input + przycisk + loader */}
      <View style={{ marginBottom: 4 }}>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Wpisz adres (np. Królewska 10, Kraków)"
            value={address}
            onChangeText={(v) => {
              setAddress(v);
              setTypingQuery(v);
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => {
              setTimeout(() => {
                setInputFocused(false);
                setSuggestions([]);
              }, 150);
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

        {shouldShowSuggestions && (
          <View style={styles.suggestionsBox}>
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {suggestions.map((s, idx) => {
                const p = s.properties || {};
                const label = p.name || p.street || "";
                const housenumber = p.housenumber || "";
                const city = p.city || p.town || p.village || "";
                const district = p.suburb || p.district || "";
                const state = p.state || "";
                const country = p.country || "";

                const line1 = [label, housenumber].filter(Boolean).join(" ");
                const line2 = [district, city, state, country]
                  .filter(Boolean)
                  .join(", ");

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
                      {line1 || "Adres"}
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
        <MapView
          ref={mapRef}
          style={{ width: "100%", height }}
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
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
              title="Wybrana lokalizacja"
              description={selectedAddress || undefined}
            />
          )}
        </MapView>
      </View>

      {marker && (
        <Text style={styles.coords}>
          {selectedAddress
            ? `📍 ${selectedAddress}`
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
  label: { fontWeight: "bold" },
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
    marginTop: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    maxHeight: 200,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
