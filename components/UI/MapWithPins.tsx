import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  StyleSheet,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useAuth } from "../../store/AuthContext";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { GlobalStyles } from "../../constants/style";
import BubbleTooltip from "./BubbleTooltip";

export type MapItem = {
  _id: string;
  title: string;
  description?: string;
  foundLocation: { lat: number; lng: number; description?: string };
  categories?: string[];
  dateFound?: string;
  createdBy: string;
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

const MapWithPins = ({
  fetchByBBox,
  initialRegion,
  idleMs = 350,
  epsilonCenterDeg = 0.0002,
  epsilonDeltaDeg = 0.0002,
  refreshToken,
  onLoadingChange,
}: Props) => {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<MapItem[]>([]);
  const [selected, setSelected] = useState<MapItem | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const regionRef = useRef<Region | null>(initialRegion ?? null);
  const lastFetchedRef = useRef<Region | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestReqId = useRef(0);
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const { userId } = useAuth();

  useEffect(() => {
    (async () => {
      try {
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
          const fallback: Region = {
            latitude: 52.237049,
            longitude: 21.017532,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          };
          regionRef.current = fallback;
          setReady(true);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        userLocationRef.current = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        };
        const userRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };
        regionRef.current = userRegion;
        setReady(true);
      } catch (e) {
        const fallback: Region = {
          latitude: 52.237049,
          longitude: 21.017532,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };
        regionRef.current = fallback;
        setReady(true);
      }
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

  const closeTooltip = useCallback(() => {
    setSelected(null);
    setAnchor(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        closeTooltip();
      };
    }, [closeTooltip])
  );

  const scheduleIdleFetch = (r: Region) => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => doFetch(r, false, false), idleMs);
  };

  const onRegionChange = (r: Region) => {
    regionRef.current = r;
    scheduleIdleFetch(r);
  };

  const updateAnchorForSelected = useCallback(async () => {
    if (!selected || !mapRef.current) return;
    try {
      const p = await mapRef.current.pointForCoordinate({
        latitude: selected.foundLocation.lat,
        longitude: selected.foundLocation.lng,
      });
      setAnchor(p);
    } catch {}
  }, [selected]);

  const onRegionChangeComplete = (r: Region) => {
    regionRef.current = r;
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    doFetch(r, false, false);
    updateAnchorForSelected();
  };

  useEffect(() => {
    if (!selected) {
      setAnchor(null);
      return;
    }
    updateAnchorForSelected();
  }, [selected, updateAnchorForSelected]);

  const recenterToUser = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        userLocationRef.current = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        };
      }

      const user = userLocationRef.current;
      if (!user) return;
      const r: Region = {
        latitude: user.lat,
        longitude: user.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };
      mapRef.current?.animateToRegion(r, 600);
      setTimeout(() => updateAnchorForSelected(), 350);
    } catch (e) {
      console.log("recenter error", e);
    }
  };

  if (!ready || !regionRef.current) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={regionRef.current}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        followsUserLocation={false}
        showsMyLocationButton={false}
        onPress={closeTooltip}
      >
        {items.map((it) => (
          <Marker
            key={it._id}
            pinColor={
              String(it.createdBy) === String(userId)
                ? GlobalStyles.colors.primary
                : GlobalStyles.colors.error
            }
            coordinate={{
              latitude: it.foundLocation.lat,
              longitude: it.foundLocation.lng,
            }}
            onPress={(e) => {
              e.stopPropagation?.();
              setSelected(it);
            }}
          />
        ))}
      </MapView>

      {selected && anchor && (
        <BubbleTooltip
          item={selected}
          anchor={anchor}
          onClose={closeTooltip}
          onDetails={() => router.push(`/item/${selected._id}`)}
        />
      )}

      <Pressable
        onPress={recenterToUser}
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

export default MapWithPins;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    bottom: 4,
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
