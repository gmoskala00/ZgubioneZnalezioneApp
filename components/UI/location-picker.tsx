import { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, {
  Marker,
  MapPressEvent,
  Region,
  UrlTile,
} from "react-native-maps";
import * as Location from "expo-location";

const FALLBACK_REGION: Region = {
  latitude: 52.2297,
  longitude: 21.0122,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type Props = {
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  height?: number;
};

export default function LocationPicker({
  onLocationSelect,
  height = 280,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") throw new Error("no_permission");

        const loc = await Location.getCurrentPositionAsync({});
        const userRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };

        setRegion(userRegion);
      } catch (e) {
        console.warn("Brak lokalizacji, fallback do Warszawy", e);
        setRegion(FALLBACK_REGION);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "User-Agent": "ZgubioneZnalezione/1.0" } }
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
      headers: { "User-Agent": "ZgubioneZnalezione/1.0" },
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

  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ lat: latitude, lng: longitude });
    setIsGeocoding(true);
    const addr = await reverseGeocode(latitude, longitude);
    setSelectedAddress(addr);
    setIsGeocoding(false);
    onLocationSelect?.(latitude, longitude, addr);
  };

  const handleSearch = async () => {
    const q = address.trim();
    if (!q) {
      Alert.alert("Uwaga", "Wpisz adres (np. ulica, miasto).");
      return;
    }
    const res = await geocode(q);
    if (!res) {
      Alert.alert("Nie znaleziono", "Spróbuj wpisać dokładniej.");
      return;
    }
    setMarker({ lat: res.lat, lng: res.lng });
    setSelectedAddress(res.display);
    onLocationSelect?.(res.lat, res.lng, res.display);
    mapRef.current?.animateToRegion(
      {
        latitude: res.lat,
        longitude: res.lng,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      600
    );
  };

  if (loading || !region) {
    return (
      <View
        style={{
          height,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 6 }}>Pobieranie lokalizacji...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Wyszukaj adres</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Wpisz adres (np. Królewska 10, Kraków)"
          value={address}
          onChangeText={setAddress}
          onSubmitEditing={handleSearch}
        />
        <Button title="Szukaj" onPress={handleSearch} />
      </View>

      <View style={{ borderRadius: 10, overflow: "hidden" }}>
        <MapView
          ref={mapRef}
          style={{ width: "100%", height }}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={handleMapPress}
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
              coordinate={{
                latitude: marker.lat,
                longitude: marker.lng,
              }}
              title="Wybrana lokalizacja"
              description={selectedAddress || undefined}
            />
          )}
        </MapView>
      </View>

      {marker && (
        <Text style={styles.coords}>
          {isGeocoding ? "📍" : selectedAddress ? `📍 ${selectedAddress}` : ""}
        </Text>
      )}

      <Text style={styles.osm}>© OpenStreetMap contributors</Text>
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
  osm: { fontSize: 10, color: "#666", marginTop: 4 },
});
