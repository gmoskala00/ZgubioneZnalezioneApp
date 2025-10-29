import { useEffect, useMemo, useState } from "react";
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

type Claim = {
  _id: string;
  itemId: string;
  itemTitle?: string;
  ownerId: string;
  responderId: string;
  answers: [string, string];
  message?: string;
  status: "pending" | "approved" | "rejected" | "archived" | "completed";
  createdAt: string;
};

type TabKey = "inbox" | "sent" | "archived" | "completed";

export default function InboxScreen() {
  const [tab, setTab] = useState<TabKey>("inbox");
  const [data, setData] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchTab = async (t: TabKey) => {
    setLoading(true);
    try {
      const url =
        t === "inbox"
          ? "/api/claims/inbox"
          : t === "sent"
          ? "/api/claims/sent"
          : t === "archived"
          ? "/api/claims/archived"
          : "/api/claims/completed";
      const res = await Api.get<Claim[]>(url);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTab(tab);
  }, [tab]);

  const sections = useMemo(() => {
    const map = new Map<string, { title: string; claims: Claim[] }>();
    data.forEach((c) => {
      const key = c.itemId;
      const group = map.get(key) ?? {
        title: c.itemTitle ?? "Ogłoszenie",
        claims: [],
      };
      group.claims.push(c);
      map.set(key, group);
    });
    return Array.from(map.entries())
      .map(([itemId, g]) => ({
        itemId,
        title: g.title,
        data: g.claims.sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
      }))
      .sort(
        (a, b) =>
          +new Date(b.data[0]?.createdAt ?? 0) -
          +new Date(a.data[0]?.createdAt ?? 0)
      );
  }, [data]);

  const toggle = (itemId: string) =>
    setExpanded((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  const setStatus = async (
    id: string,
    status: "approved" | "rejected" | "archived" | "completed"
  ) => {
    try {
      await Api.patch(`/api/claims/${id}/status`, { status });
      fetchTab(tab);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: GlobalStyles.colors.background }}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {(["inbox", "sent", "archived", "completed"] as TabKey[]).map((k) => {
          const active = tab === k;
          const label =
            k === "inbox"
              ? "Odebrane"
              : k === "sent"
              ? "Wysłane"
              : k === "archived"
              ? "Archiwum"
              : "Zakończone";
          return (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              style={[
                styles.tab,
                active && {
                  backgroundColor: GlobalStyles.colors.primaryDark,
                  borderColor: GlobalStyles.colors.primaryDark,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  active && { color: GlobalStyles.colors.card },
                ]}
              >
                {label}
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
              onPress={() => toggle(section.itemId)}
            >
              <Text style={styles.headerTitle} numberOfLines={1}>
                {section.title}
              </Text>
              <Text style={styles.headerMeta}>
                {expanded[section.itemId] ? "▲" : "▼"} {section.data.length}{" "}
                odpowiedzi
              </Text>
            </Pressable>
          )}
          renderItem={({ item, section }) =>
            expanded[section.itemId] ? (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={getStatusStyle(item.status)}>
                    {item.status.toUpperCase()}
                  </Text>
                  <Text style={styles.date}>
                    {dayjs(item.createdAt)
                      .locale("pl")
                      .format("D MMM YYYY, HH:mm")}
                  </Text>
                </View>

                <Text style={styles.q}>Pytanie 1 — odpowiedź:</Text>
                <Text style={styles.a}>{item.answers[0]}</Text>
                <Text style={styles.q}>Pytanie 2 — odpowiedź:</Text>
                <Text style={styles.a}>{item.answers[1]}</Text>
                {item.message ? (
                  <Text style={styles.msg}>„{item.message}”</Text>
                ) : null}

                {/* Akcje tylko w Odebranych i gdy pending / approved */}
                {tab === "inbox" && item.status === "pending" && (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => setStatus(item._id, "approved")}
                      style={[styles.btn, styles.btnApprove]}
                    >
                      <Text style={styles.btnText}>Zatwierdź</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setStatus(item._id, "rejected")}
                      style={[styles.btn, styles.btnReject]}
                    >
                      <Text style={styles.btnText}>Odrzuć</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setStatus(item._id, "archived")}
                      style={[styles.btn, styles.btnArchive]}
                    >
                      <Text style={styles.btnText}>Archiwizuj</Text>
                    </Pressable>
                  </View>
                )}

                {tab === "inbox" && item.status === "approved" && (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => setStatus(item._id, "completed")}
                      style={[styles.btn, styles.btnDone]}
                    >
                      <Text style={styles.btnText}>Oznacz jako zakończone</Text>
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

/** Dynamiczny styl statusu (poza StyleSheet.create) */
const getStatusStyle = (s: string) => ({
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
      : GlobalStyles.colors.primaryDark,
});

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    backgroundColor: GlobalStyles.colors.card,
  },
  tabText: {
    color: GlobalStyles.colors.textPrimary,
    fontWeight: "600",
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
