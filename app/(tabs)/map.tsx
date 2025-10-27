import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import MapView, { Marker, Callout, Region } from "react-native-maps";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { router } from "expo-router";
import { API_URL } from "../../constants/api";

type FoundItem = {
  _id: string;
  title: string;
  description: string;
  dateFound: string;
  foundLocation: { lat: number; lng: number; description: string };
  categories?: string[];
};

const MapScreen = () => {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);
  const [region] = useState<Region>({
    latitude: 52.2297,
    longitude: 21.0122,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/found-items`);
        const data = await res.json();
        setItems(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={region}>
      {items.map((it) => (
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
                {dayjs(it.dateFound).locale("pl").format("D MMMM YYYY, HH:mm")}
              </Text>
              <View style={[styles.btn, { marginTop: 10 }]}>
                <Text style={styles.btnText}>Szczegóły</Text>
              </View>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
});
