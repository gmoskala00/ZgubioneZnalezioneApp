import { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";

export type MapItem = {
  _id: string;
  title: string;
  description?: string;
  foundLocation: { lat: number; lng: number; description?: string };
  categories?: string[];
};

type Props = {
  fetchByBBox: (
    n: number,
    e: number,
    s: number,
    w: number
  ) => Promise<MapItem[]>;
  initialRegion?: Region;
  idleMs?: number;
  epsilonCenterDeg?: number;
  epsilonDeltaDeg?: number;
  refreshToken?: string | number;
  onLoadingChange?: (loading: boolean) => void;
};

export default function MapWithPins({
  fetchByBBox,
  initialRegion,
  idleMs = 350,
  epsilonCenterDeg = 0.0002,
  epsilonDeltaDeg = 0.0002,
  refreshToken,
  onLoadingChange,
}: Props) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<MapItem[]>([]);

  const mapRef = useRef<MapView | null>(null);

  const regionRef = useRef<Region | null>(initialRegion ?? null);
  const lastFetchedRef = useRef<Region | null>(null);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestReqId = useRef(0);

  useEffect(() => {
    (async () => {
      if (regionRef.current) {
        setReady(true);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Brak uprawnień do lokalizacji",
          "Użyjemy pozycji domyślnej."
        );
        regionRef.current = {
          latitude: 52.237049,
          longitude: 21.017532,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };
        setReady(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      regionRef.current = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
      setReady(true);
    })();
  }, []);

  const nearlyEqual = (a: Region | null, b: Region | null) => {
    if (!a || !b) return false;
    return (
      Math.abs(a.latitude - b.latitude) < epsilonCenterDeg &&
      Math.abs(a.longitude - b.longitude) < epsilonCenterDeg &&
      Math.abs(a.latitudeDelta - b.latitudeDelta) < epsilonDeltaDeg &&
      Math.abs(a.longitudeDelta - b.longitudeDelta) < epsilonDeltaDeg
    );
  };

  const doFetch = async (r: Region, showLoading: boolean, force = false) => {
    if (!force && nearlyEqual(r, lastFetchedRef.current)) return;

    const latDelta = Math.max(r.latitudeDelta, 0.0005);
    const lngDelta = Math.max(r.longitudeDelta, 0.0005);

    const n = r.latitude + latDelta / 2;
    const s = r.latitude - latDelta / 2;
    const e = r.longitude + lngDelta / 2;
    const w = r.longitude - lngDelta / 2;

    const reqId = ++latestReqId.current;
    try {
      if (showLoading) onLoadingChange?.(true);
      const data = await fetchByBBox(n, e, s, w);
      if (reqId === latestReqId.current) {
        setItems(data);
        lastFetchedRef.current = r;
      }
    } catch (e: any) {
      console.error("BBOX fetch error:", e?.message || e);
    } finally {
      if (showLoading) onLoadingChange?.(false);
    }
  };

  useEffect(() => {
    if (!ready || !regionRef.current) return;
    doFetch(regionRef.current, true, true);
  }, [ready]);

  useEffect(() => {
    if (!ready || !regionRef.current) return;
    if (refreshToken === undefined) return;
    doFetch(regionRef.current, true, true);
  }, [refreshToken]);

  useEffect(() => {
    if (!ready || !regionRef.current) return;
    doFetch(regionRef.current, true, true);
  }, [fetchByBBox]);

  const scheduleIdleFetch = (r: Region) => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => doFetch(r, false, false), idleMs);
  };

  const onRegionChange = (r: Region) => {
    regionRef.current = r;
    scheduleIdleFetch(r);
  };

  const onRegionChangeComplete = (r: Region) => {
    regionRef.current = r;
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    doFetch(r, false, false);
  };

  if (!ready || !regionRef.current) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={regionRef.current}
      onRegionChange={onRegionChange}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {items.map((it) => (
        <Marker
          key={it._id}
          title={it.title}
          description={it.description || ""}
          coordinate={{
            latitude: it.foundLocation.lat,
            longitude: it.foundLocation.lng,
          }}
        />
      ))}
    </MapView>
  );
}
