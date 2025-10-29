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
import { useAuth } from "../../store/AuthContext";
import { labelStatus } from "../../i18n/labels";

type ClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "archived"
  | "completed"
  | "expired";

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
};

type InboxGroup = {
  itemId: string;
  itemTitle: string;
  itemStatus: "active" | "returned" | "expired";
  claims: Claim[];
};

type ModeKey = "mine" | "responses"; // Moje ogłoszenia / Moje odpowiedzi
type SubKey = "active" | "closed"; // Aktualne / Zakończone

export default function InboxScreen() {
  const { userId } = useAuth();
  const [mode, setMode] = useState<ModeKey>("mine");
  const [subTab, setSubTab] = useState<SubKey>("active");
  const [mineGroups, setMineGroups] = useState<InboxGroup[]>([]);
  const [sentClaims, setSentClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchMine = async () => {
    setLoading(true);
    try {
      const res = await Api.get<InboxGroup[]>("/api/claims/inbox");
      setMineGroups(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSent = async () => {
    setLoading(true);
    try {
      const res = await Api.get<Claim[]>("/api/claims/sent");
      setSentClaims(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "mine") fetchMine();
    else fetchSent();
  }, [mode]);

  const ACTIVE: ClaimStatus[] = ["pending", "approved"];
  const CLOSED: ClaimStatus[] = [
    "rejected",
    "archived",
    "completed",
    "expired",
  ];

  const sections = useMemo(() => {
    if (mode === "mine") {
      // Pokaż WSZYSTKIE moje ogłoszenia w „Aktualne” (nawet z 0 odp.)
      const groupsFiltered = mineGroups.filter((g) => {
        if (subTab === "active") {
          return g.itemStatus !== "returned" && g.itemStatus !== "expired";
        } else {
          return g.itemStatus === "returned" || g.itemStatus === "expired";
        }
      });

      return groupsFiltered
        .map((g) => {
          const claimsFiltered =
            subTab === "active"
              ? (g.claims ?? []).filter((c) => ACTIVE.includes(c.status))
              : (g.claims ?? []).filter((c) => CLOSED.includes(c.status));

          claimsFiltered.sort(
            (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
          );

          return {
            itemId: g.itemId,
            title: g.itemTitle,
            data: claimsFiltered, // UWAGA: może być [] — i tak pokażemy pustą sekcję
          };
        })
        .sort((A, B) => {
          const aTop = A.data[0]?.createdAt ?? 0;
          const bTop = B.data[0]?.createdAt ?? 0;
          return +new Date(bTop) - +new Date(aTop);
        });
    } else {
      // Moje odpowiedzi — grupujemy po itemId
      const list =
        subTab === "active"
          ? sentClaims.filter((c) => ACTIVE.includes(c.status))
          : sentClaims.filter((c) => CLOSED.includes(c.status));

      const map = new Map<string, { title: string; claims: Claim[] }>();
      list.forEach((c) => {
        const key = c.itemId;
        const g = map.get(key) ?? {
          title: c.itemTitle ?? "Ogłoszenie",
          claims: [],
        };
        g.claims.push(c);
        map.set(key, g);
      });

      return Array.from(map.entries()).map(([itemId, g]) => ({
        itemId,
        title: g.title,
        data: g.claims.sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
      }));
    }
  }, [mode, subTab, mineGroups, sentClaims]);

  const toggle = (itemId: string) =>
    setExpanded((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  const setStatus = async (
    id: string,
    status: "approved" | "rejected" | "archived" | "completed"
  ) => {
    try {
      await Api.patch(`/api/claims/${id}/status`, { status });
    } catch (e) {
      console.error(e);
    } finally {
      // Odśwież bieżący tryb
      if (mode === "mine") fetchMine();
      else fetchSent();
    }
  };

  const isSentMode = mode === "responses";

  return (
    <View style={{ flex: 1, backgroundColor: GlobalStyles.colors.background }}>
      {/* GŁÓWNE ZAKŁADKI */}
      <View style={styles.mainTabs}>
        {[
          { key: "mine", label: "🧭 Moje ogłoszenia" },
          { key: "responses", label: "💬 Moje odpowiedzi" },
        ].map((t) => {
          const active = mode === (t.key as ModeKey);
          return (
            <Pressable
              key={t.key}
              onPress={() => setMode(t.key as ModeKey)}
              style={[styles.mainTab, active && styles.mainTabActive]}
            >
              <Text
                style={[styles.mainTabText, active && styles.mainTabTextActive]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* PODZAKŁADKI */}
      <View style={styles.subTabs}>
        {[
          { key: "active", label: "📬 Aktualne" },
          { key: "closed", label: "🗂️ Zakończone" },
        ].map((t) => {
          const active = subTab === (t.key as SubKey);
          return (
            <Pressable
              key={t.key}
              onPress={() => setSubTab(t.key as SubKey)}
              style={[styles.subTab, active && styles.subTabActive]}
            >
              <Text
                style={[styles.subTabText, active && styles.subTabTextActive]}
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
          renderSectionHeader={({ section }) => {
            const count = section.data.length;
            const meta = isSentMode
              ? "Twoja odpowiedź"
              : `${count} odpowiedź${count === 1 ? "" : "i"}`;

            return (
              <Pressable
                style={styles.header}
                onPress={() => toggle(section.itemId)}
              >
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {section.title}
                </Text>
                <Text style={styles.headerMeta}>
                  {expanded[section.itemId] ? "▲" : "▼"} {meta}
                </Text>
              </Pressable>
            );
          }}
          renderItem={({ item, section }) =>
            expanded[section.itemId] ? (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={getStatusTextStyle(item.status)}>
                    {labelStatus(item.status)}
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

                {/* Akcje: tylko MOJE OGŁOSZENIA + Aktualne + status pending/approved */}
                {!isSentMode &&
                  subTab === "active" &&
                  item.status === "pending" && (
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

                {!isSentMode &&
                  subTab === "active" &&
                  item.status === "approved" && (
                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => setStatus(item._id, "completed")}
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
          // jeśli sekcja pusta i zwinięta – pokaż pusty placeholder po sekcją
          renderSectionFooter={({ section }) =>
            !expanded[section.itemId] || section.data.length > 0 ? null : (
              <View style={styles.card}>
                <Text style={{ color: GlobalStyles.colors.textSecondary }}>
                  Brak odpowiedzi
                </Text>
              </View>
            )
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

/** Dynamiczny kolor statusu (poza StyleSheet.create) */
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

const styles = StyleSheet.create({
  // główne zakładki
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

  // podzakładki
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

  // sekcje i karty
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
