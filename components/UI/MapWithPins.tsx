import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import MapView, { Marker, Region, Callout } from "react-native-maps";
import { useAuth } from "../../store/AuthContext";
import * as Location from "expo-location";
import dayjs from "dayjs";
import "dayjs/locale/pl";
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
  const markerRefs = useRef<Record<string, any>>({});
  const selectedIdRef = useRef<string | null>(null);

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
        regionRef.current = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };
        setReady(true);
      } catch {
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

  const hideSelectedCallout = useCallback(() => {
    if (Platform.OS !== "ios") return;
    const id = selectedIdRef.current;
    if (!id) return;
    markerRefs.current[id]?.hideCallout?.();
  }, []);

  const closeTooltip = useCallback(() => {
    hideSelectedCallout();
    selectedIdRef.current = null;

    if (Platform.OS === "android") {
      setSelected(null);
      setAnchor(null);
    }
  }, [hideSelectedCallout]);

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

  const updateAnchorForSelectedAndroid = useCallback(async () => {
    if (Platform.OS !== "android") return;
    if (!selected || !mapRef.current) return;

    try {
      const p = await mapRef.current.pointForCoordinate({
        latitude: selected.foundLocation.lat,
        longitude: selected.foundLocation.lng,
      });

      const { width: W, height: H } = Dimensions.get("window");
      const M = 10;

      const isOffscreen = p.x < M || p.y < M || p.x > W - M || p.y > H - M;

      if (isOffscreen) {
        setSelected(null);
        setAnchor(null);
        return;
      }

      setAnchor(p);
    } catch {
      setSelected(null);
      setAnchor(null);
    }
  }, [selected]);

  const onRegionChangeComplete = (r: Region) => {
    regionRef.current = r;
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    doFetch(r, false, false);

    if (Platform.OS === "android") {
      updateAnchorForSelectedAndroid();
    }
  };

  useEffect(() => {
    if (Platform.OS !== "android") return;

    if (!selected) {
      setAnchor(null);
      return;
    }

    updateAnchorForSelectedAndroid();
  }, [selected, updateAnchorForSelectedAndroid]);

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

      if (Platform.OS === "android") {
        setTimeout(() => updateAnchorForSelectedAndroid(), 350);
      }
    } catch (e) {
      console.log("recenter error", e);
    }
  };

  const goDetailsIOS = useCallback(
    (id: string) => {
      hideSelectedCallout();
      selectedIdRef.current = null;
      router.push(`/item/${id}`);
    },
    [hideSelectedCallout]
  );

  const goDetailsAndroid = useCallback((id: string) => {
    setSelected(null);
    setAnchor(null);
    router.push(`/item/${id}`);
  }, []);

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
            ref={(ref) => {
              if (ref) markerRefs.current[it._id] = ref;
            }}
            pinColor={
              String(it.createdBy) === String(userId)
                ? GlobalStyles.colors.primary
                : GlobalStyles.colors.error
            }
            coordinate={{
              latitude: it.foundLocation.lat,
              longitude: it.foundLocation.lng,
            }}
            hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
            onPress={(e) => {
              e.stopPropagation?.();
              selectedIdRef.current = it._id;

              if (Platform.OS === "android") {
                setSelected(it);
              }
            }}
          >
            {Platform.OS === "ios" ? (
              <Callout tooltip={false} onPress={() => goDetailsIOS(it._id)}>
                <View style={styles.callout}>
                  <Text style={styles.title} numberOfLines={1}>
                    {it.title}
                  </Text>

                  {!!(it.foundLocation.description || it.description) && (
                    <Text style={styles.desc} numberOfLines={2}>
                      {it.foundLocation.description || it.description || ""}
                    </Text>
                  )}

                  {!!it.dateFound && (
                    <Text style={styles.meta}>
                      Znaleziono:{" "}
                      {dayjs(it.dateFound)
                        .locale("pl")
                        .format("D MMMM YYYY, HH:mm")}
                    </Text>
                  )}

                  <View style={[styles.btn, { marginTop: 10 }]}>
                    <Text style={styles.btnText}>Szczegóły</Text>
                  </View>
                </View>
              </Callout>
            ) : null}
          </Marker>
        ))}
      </MapView>

      {Platform.OS === "android" && selected && anchor && (
        <BubbleTooltip
          item={selected}
          anchor={anchor}
          onClose={closeTooltip}
          onDetails={() => goDetailsAndroid(selected._id)}
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
    backgroundColor: GlobalStyles.colors.primary,
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
    bottom: 4,
    right: 8,
    backgroundColor: "transparent",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  osmText: { fontSize: 10, color: "#555" },
});
