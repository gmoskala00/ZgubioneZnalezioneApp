import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  SectionList,
} from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { Api } from "../../services/api";
import { GlobalStyles } from "../../constants/style";
import { useAuth } from "../../store/AuthContext";
import { labelStatus } from "../../i18n/labels";

dayjs.locale("pl");

/** Statusy pojedynczej odpowiedzi (claimu) */
type ClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "archived"
  | "completed"
  | "expired";

/** Pojedyncza odpowiedź */
type Claim = {
  _id: string;
  itemId: string;
  itemTitle?: string;
  ownerId: string;
  responderId: string;
  answers: [string, string];
  message?: string;
  status: ClaimStatus;
  createdAt: string;
  ownerUnread?: boolean;
  responderUnread?: boolean;
};

type InboxGroup = {
  itemId: string;
  itemTitle: string;
  itemStatus?: "active" | "expired" | "returned";
  claims: Claim[];
};

type ModeKey = "mine" | "responses";
type SubMine = "active" | "closed";
type SubResp = "pending" | "approved" | "rejected";

export default function InboxScreen() {
  const { userId } = useAuth();
  const [mode, setMode] = useState<ModeKey>("mine");
  const [subMine, setSubMine] = useState<SubMine>("active");
  const [subResp, setSubResp] = useState<SubResp>("pending");

  const [groupsMine, setGroupsMine] = useState<InboxGroup[]>([]);
  const [claimsResp, setClaimsResp] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [badgeMine, setBadgeMine] = useState(0);
  const [badgeResp, setBadgeResp] = useState(0);

  const refreshBadges = useCallback(async () => {
    try {
      const [m, r] = await Promise.all([
        Api.unreadCount("mine"),
        Api.unreadCount("responses"),
      ]);
      setBadgeMine(m.count);
      setBadgeResp(r.count);
    } catch {}
  }, []);

  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  const fetchData = useCallback(async (m: ModeKey) => {
    setLoading(true);
    try {
      if (m === "mine") {
        const res = await Api.get<InboxGroup[]>("/api/claims/inbox");
        setGroupsMine(res);
      } else {
        const res = await Api.get<Claim[]>("/api/claims/sent");
        setClaimsResp(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(mode);
  }, [mode, fetchData]);

  const ACTIVE_STATUSES: ClaimStatus[] = ["pending", "approved"];
  const CLOSED_STATUSES: ClaimStatus[] = [
    "rejected",
    "archived",
    "completed",
    "expired",
  ];

  const sections = useMemo(() => {
    if (mode === "mine") {
      const isItemClosed = (g: InboxGroup) =>
        g.itemStatus === "returned" || g.itemStatus === "expired";

      const mineFiltered = groupsMine.filter((g) => {
        if (subMine === "active") {
          const anyActive = g.claims.some((c) =>
            ACTIVE_STATUSES.includes(c.status)
          );
          return !isItemClosed(g) || anyActive || g.claims.length === 0;
        } else {
          const anyClosed = g.claims.some((c) =>
            CLOSED_STATUSES.includes(c.status)
          );
          return isItemClosed(g) || anyClosed;
        }
      });

      return mineFiltered
        .map((g) => ({
          itemId: g.itemId,
          title: g.itemTitle || "Ogłoszenie",
          data: [...g.claims].sort(
            (a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0)
          ),
          itemStatus: g.itemStatus,
        }))
        .sort(
          (a, b) =>
            +new Date(b.data[0]?.createdAt ?? 0) -
            +new Date(a.data[0]?.createdAt ?? 0)
        );
    }

    const filteredClaims = claimsResp.filter((c) => c.status === subResp);

    const map = new Map<string, { title: string; claims: Claim[] }>();
    filteredClaims.forEach((c) => {
      const k = c.itemId;
      const group = map.get(k) ?? {
        title: c.itemTitle ?? "Ogłoszenie",
        claims: [],
      };
      group.claims.push(c);
      map.set(k, group);
    });

    return Array.from(map.entries())
      .map(([itemId, g]) => ({
        itemId,
        title: g.title,
        data: g.claims.sort(
          (a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0)
        ),
      }))
      .sort(
        (a, b) =>
          +new Date(b.data[0]?.createdAt ?? 0) -
          +new Date(a.data[0]?.createdAt ?? 0)
      );
  }, [mode, subMine, subResp, groupsMine, claimsResp]);

  const toggle = (itemId: string) =>
    setExpanded((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  const headerHasUnread = (section: any) => {
    if (!section?.data) return false;
    if (mode === "mine") {
      return section.data.some((c: Claim) => c.ownerUnread);
    }
    return section.data.some((c: Claim) => c.responderUnread);
  };

  const markSectionSeen = async (section: any) => {
    try {
      const toMark = (section.data as Claim[]).filter((c) =>
        mode === "mine" ? c.ownerUnread : c.responderUnread
      );
      if (toMark.length === 0) return;
      await Promise.all(
        toMark.map((c) =>
          Api.markClaimSeen(c._id, mode === "mine" ? "owner" : "responder")
        )
      );
      refreshBadges();
      if (mode === "mine") {
        setGroupsMine((prev) =>
          prev.map((g) =>
            g.itemId === section.itemId
              ? {
                  ...g,
                  claims: g.claims.map((c) =>
                    toMark.find((x) => x._id === c._id)
                      ? { ...c, ownerUnread: false }
                      : c
                  ),
                }
              : g
          )
        );
      } else {
        setClaimsResp((prev) =>
          prev.map((c) =>
            toMark.find((x) => x._id === c._id)
              ? { ...c, responderUnread: false }
              : c
          )
        );
      }
    } catch {}
  };

  const getStatusTextStyle = (s: ClaimStatus) => ({
    fontWeight: "bold" as const,
    color:
      s === "approved"
        ? "#2e7d32"
        : s === "rejected"
        ? GlobalStyles.colors.error
        : s === "pending"
        ? "#f9a825"
        : s === "archived"
        ? "#546e7a"
        : s === "expired"
        ? "#8e8e8e"
        : GlobalStyles.colors.primaryDark,
  });

  return (
    <View style={{ flex: 1, backgroundColor: GlobalStyles.colors.background }}>
      {/* GŁÓWNE ZAKŁADKI */}
      <View style={styles.mainTabs}>
        {[
          { key: "mine", label: "🧭 Moje ogłoszenia", badge: badgeMine },
          { key: "responses", label: "💬 Moje odpowiedzi", badge: badgeResp },
        ].map((t) => {
          const k = t.key as ModeKey;
          const active = mode === k;
          return (
            <Pressable
              key={t.key}
              onPress={() => setMode(k)}
              style={[styles.mainTab, active && styles.mainTabActive]}
            >
              <View
                style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
              >
                <Text
                  style={[
                    styles.mainTabText,
                    active && styles.mainTabTextActive,
                  ]}
                >
                  {t.label}
                </Text>
                {!!t.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t.badge}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* PODZAKŁADKI */}
      <View style={styles.subTabs}>
        {mode === "mine"
          ? (
              [
                { key: "active", label: "📬 Aktualne" },
                { key: "closed", label: "🗂️ Zakończone" },
              ] as const
            ).map((t) => {
              const active = subMine === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setSubMine(t.key)}
                  style={[styles.subTab, active && styles.subTabActive]}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      active && styles.subTabTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })
          : (
              [
                { key: "pending", label: "⏳ Oczekujące" },
                { key: "approved", label: "✅ Zaakceptowane" },
                { key: "rejected", label: "❌ Odmowy" },
              ] as const
            ).map((t) => {
              const active = subResp === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setSubResp(t.key)}
                  style={[styles.subTab, active && styles.subTabActive]}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      active && styles.subTabTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GlobalStyles.colors.accent} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderSectionHeader={({ section }) => (
            <Pressable
              style={styles.header}
              onPress={() => {
                const willExpand = !expanded[section.itemId];
                toggle(section.itemId);
                if (willExpand) {
                  markSectionSeen(section);
                }
              }}
            >
              <Text style={styles.headerTitle} numberOfLines={1}>
                {section.title}
              </Text>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {headerHasUnread(section) && <View style={styles.dot} />}
                <Text style={styles.headerMeta}>
                  {mode === "responses"
                    ? "Twoja odpowiedź"
                    : `${section.data.length} odpowiedź${
                        section.data.length === 1 ? "" : "i"
                      }`}
                </Text>
              </View>
            </Pressable>
          )}
          renderItem={({ item, section }) =>
            expanded[section.itemId] ? (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={getStatusTextStyle(item.status)}>
                    {labelStatus(item.status)}
                  </Text>
                  <Text style={styles.date}>
                    {dayjs(item.createdAt).format("D MMM YYYY, HH:mm")}
                  </Text>
                </View>

                <Text style={styles.q}>Pytanie 1 — odpowiedź:</Text>
                <Text style={styles.a}>{item.answers[0]}</Text>
                <Text style={styles.q}>Pytanie 2 — odpowiedź:</Text>
                <Text style={styles.a}>{item.answers[1]}</Text>
                {item.message ? (
                  <Text style={styles.msg}>„{item.message}”</Text>
                ) : null}

                {/* Akcje tylko dla MOICH OGŁOSZEŃ w "Aktualne" i statusie pending/approved */}
                {mode === "mine" &&
                  subMine === "active" &&
                  item.status === "pending" && (
                    <View style={styles.actions}>
                      <Pressable
                        onPress={async () => {
                          try {
                            await Api.patch(`/api/claims/${item._id}/status`, {
                              status: "approved",
                            });
                            fetchData(mode);
                            refreshBadges();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        style={[styles.btn, styles.btnApprove]}
                      >
                        <Text style={styles.btnText}>Zatwierdź</Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          try {
                            await Api.patch(`/api/claims/${item._id}/status`, {
                              status: "rejected",
                            });
                            fetchData(mode);
                            refreshBadges();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        style={[styles.btn, styles.btnReject]}
                      >
                        <Text style={styles.btnText}>Odrzuć</Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          try {
                            await Api.patch(`/api/claims/${item._id}/status`, {
                              status: "archived",
                            });
                            fetchData(mode);
                            refreshBadges();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        style={[styles.btn, styles.btnArchive]}
                      >
                        <Text style={styles.btnText}>Archiwizuj</Text>
                      </Pressable>
                    </View>
                  )}

                {mode === "mine" &&
                  subMine === "active" &&
                  item.status === "approved" && (
                    <View style={styles.actions}>
                      <Pressable
                        onPress={async () => {
                          try {
                            await Api.patch(`/api/claims/${item._id}/status`, {
                              status: "completed",
                            });
                            fetchData(mode);
                            refreshBadges();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        style={[styles.btn, styles.btnDone]}
                      >
                        <Text style={styles.btnText}>
                          Oznacz jako zakończone
                        </Text>
                      </Pressable>
                    </View>
                  )}
              </View>
            ) : null
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: GlobalStyles.colors.textSecondary }}>
                Brak elementów
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: GlobalStyles.colors.card,
    borderBottomWidth: 1,
    borderColor: GlobalStyles.colors.border,
  },
  mainTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  mainTabActive: {
    backgroundColor: GlobalStyles.colors.primary,
  },
  mainTabText: {
    color: GlobalStyles.colors.textSecondary,
    fontWeight: "600",
  },
  mainTabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  badge: {
    minWidth: 18,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    backgroundColor: GlobalStyles.colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  subTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
  },
  subTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    borderRadius: 20,
    backgroundColor: GlobalStyles.colors.card,
  },
  subTabActive: {
    backgroundColor: GlobalStyles.colors.primaryDark,
    borderColor: GlobalStyles.colors.primaryDark,
  },
  subTabText: {
    color: GlobalStyles.colors.textPrimary,
  },
  subTabTextActive: {
    color: "#fff",
  },

  header: {
    backgroundColor: GlobalStyles.colors.card,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
  },
  headerTitle: {
    fontWeight: "bold",
    color: GlobalStyles.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  headerMeta: { color: GlobalStyles.colors.textSecondary },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GlobalStyles.colors.accent,
  },

  card: {
    backgroundColor: GlobalStyles.colors.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { color: GlobalStyles.colors.textSecondary, fontSize: 12 },
  q: {
    marginTop: 8,
    fontWeight: "600",
    color: GlobalStyles.colors.textPrimary,
  },
  a: { color: GlobalStyles.colors.textPrimary },
  msg: {
    marginTop: 6,
    fontStyle: "italic",
    color: GlobalStyles.colors.textSecondary,
  },

  actions: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  btnApprove: { backgroundColor: GlobalStyles.colors.primary },
  btnReject: { backgroundColor: GlobalStyles.colors.error },
  btnArchive: { backgroundColor: "#607D8B" },
  btnDone: { backgroundColor: "#1565C0" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
