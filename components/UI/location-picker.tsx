import { useRef, useState } from "react";
import { View, StyleSheet, Text, TextInput, Button, Alert } from "react-native";
import MapView, {
  Marker,
  MapPressEvent,
  Region,
  UrlTile,
  LongPressEvent,
} from "react-native-maps";

type Props = {
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  initialRegion?: Region;
  height?: number;
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
        addr.city || addr.town || addr.village,
        addr.postcode,
      ].filter(Boolean);

      return parts.join(", ");
    } catch {
      return undefined;
    }
  };

  const geocode = async (query: string) => {
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
    updateAddress: boolean
  ) => {
    setMarker({ lat, lng });
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
    placeMarker(latitude, longitude, true);
  };

  const handleMapLongPress = (e: LongPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    placeMarker(latitude, longitude, true);
  };

  const handleSearch = async () => {
    const q = address.trim();
    if (!q) {
      Alert.alert("Uwaga", "Wpisz adres (np. ulica, miasto).");
      return;
    }
    try {
      const res = await geocode(q);
      if (!res) {
        Alert.alert(
          "Nie znaleziono",
          "Spróbuj wpisać dokładniej (ulica, numer, miasto)."
        );
        return;
      }
      await placeMarker(res.lat, res.lng, false);
      mapRef.current?.animateToRegion(
        {
          latitude: res.lat,
          longitude: res.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        300
      );
    } catch {
      Alert.alert("Błąd geokodowania", "Sprawdź połączenie z internetem.");
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Wyszukaj adres</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Wpisz adres (np. Królewska 10, Kraków)"
          value={address}
          onChangeText={setAddress}
          autoCorrect={false}
          autoCapitalize="sentences"
          keyboardType="default"
          inputMode="text"
          onSubmitEditing={handleSearch}
        />
        <Button title="Szukaj" onPress={handleSearch} />
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
  },
  coords: { marginTop: 6, color: "#555" },
});
