import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  SectionList,
  RefreshControl,
  Alert,
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
  ownerUnread?: boolean;
  responderUnread?: boolean;
  contactForOwner?: { email?: string; phone?: string };
  contactForResponder?: {
    email?: string;
    phone?: string;
    method?: "email" | "phone" | "other";
    detailsFromForm?: string;
  };
  ownerContactOther?: string;
};

type InboxGroup = {
  itemId: string;
  itemTitle: string;
  itemStatus: "active" | "expired" | "returned";
  claims: Claim[];
};

type ModeKey = "mine" | "responses";
type SubKey = "active" | "closed";

export default function InboxScreen() {
  const { userId } = useAuth();
  const [mode, setMode] = useState<ModeKey>("mine");
  const [subTab, setSubTab] = useState<SubKey>("active");

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [inboxGroups, setInboxGroups] = useState<InboxGroup[]>([]);
  const [claimsSent, setClaimsSent] = useState<Claim[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchMine = useCallback(async () => {
    const res = await Api.get<InboxGroup[]>("/api/claims/inbox");
    setInboxGroups(res);
  }, []);

  const fetchResponses = useCallback(async () => {
    const res = await Api.get<Claim[]>("/api/claims/sent");
    setClaimsSent(res);
  }, []);

  const fetchCurrent = useCallback(
    async (kind: ModeKey, first = false) => {
      try {
        if (first) setIsInitialLoading(true);
        if (!first) setIsRefreshing(true);
        if (kind === "mine") await fetchMine();
        else await fetchResponses();
      } catch (e) {
        console.error(e);
      } finally {
        if (first) setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchMine, fetchResponses]
  );

  useEffect(() => {
    fetchCurrent(mode, true);
  }, [mode, fetchCurrent]);

  const onRefresh = useCallback(
    () => fetchCurrent(mode, false),
    [mode, fetchCurrent]
  );

  const sections = useMemo(() => {
    if (mode === "mine") {
      const filtered = inboxGroups.filter((g) =>
        subTab === "active"
          ? g.itemStatus === "active"
          : g.itemStatus !== "active"
      );
      return filtered
        .map((g) => ({
          itemId: g.itemId,
          title: g.itemTitle,
          data: g.claims
            .slice()
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
        }))
        .sort(
          (a, b) =>
            +new Date(b.data[0]?.createdAt ?? 0) -
            +new Date(a.data[0]?.createdAt ?? 0)
        );
    } else {
      const ACTIVE: ClaimStatus[] = ["pending"];
      const CLOSED: ClaimStatus[] = ["approved", "rejected", "completed"];
      const filtered = claimsSent.filter((c) =>
        subTab === "active"
          ? ACTIVE.includes(c.status)
          : CLOSED.includes(c.status)
      );
      const map = new Map<string, { title: string; claims: Claim[] }>();
      filtered.forEach((c) => {
        const g = map.get(c.itemId) ?? {
          title: c.itemTitle ?? "Ogłoszenie",
          claims: [],
        };
        g.claims.push(c);
        map.set(c.itemId, g);
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
    }
  }, [mode, subTab, inboxGroups, claimsSent]);

  const toggle = (itemId: string) =>
    setExpanded((p) => ({ ...p, [itemId]: !p[itemId] }));

  const confirm = (title: string, message: string, onOk: () => void) => {
    Alert.alert(title, message, [
      { text: "Anuluj", style: "cancel" },
      { text: "OK", onPress: onOk },
    ]);
  };

  const updateStatus = async (
    id: string,
    status: "approved" | "rejected" | "archived" | "completed"
  ) => {
    await Api.patch(`/api/claims/${id}/status`, { status });
    fetchCurrent(mode, false);
  };

  const renderHeaderMeta = (section: { itemId: string; data: Claim[] }) => {
    if (mode === "responses") return "Twoja odpowiedź";
    const count = section.data.length;
    return `${count} odpowiedź${
      count === 1 ? "" : count >= 2 && count <= 4 ? "e" : "i"
    }`;
  };

  const renderContacts = (c: Claim) => {
    if (c.status !== "approved") return null;
    return (
      <View style={styles.contactBox}>
        {mode === "mine" ? (
          <>
            <Text style={styles.contactTitle}>
              Dane kontaktowe zgłaszającego:
            </Text>
            {!!c.contactForOwner?.email && (
              <Text style={styles.contactLine}>
                E-mail: {c.contactForOwner.email}
              </Text>
            )}
            {!!c.contactForOwner?.phone && (
              <Text style={styles.contactLine}>
                Telefon: {c.contactForOwner.phone}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.contactTitle}>
              Dane kontaktowe właściciela:
            </Text>
            {!!c.contactForResponder?.detailsFromForm &&
              c.contactForResponder?.method === "other" && (
                <Text style={styles.contactLine}>
                  Kontakt (formularz): {c.contactForResponder.detailsFromForm}
                </Text>
              )}
            {!!c.contactForResponder?.email && (
              <Text style={styles.contactLine}>
                E-mail: {c.contactForResponder.email}
              </Text>
            )}
            {!!c.contactForResponder?.phone && (
              <Text style={styles.contactLine}>
                Telefon: {c.contactForResponder.phone}
              </Text>
            )}
          </>
        )}
      </View>
    );
  };

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

      {/* LISTA */}
      {isInitialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GlobalStyles.colors.accent} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={GlobalStyles.colors.accent}
              colors={[GlobalStyles.colors.accent]}
            />
          }
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          alwaysBounceVertical
          bounces
          renderSectionHeader={({ section }) => (
            <Pressable
              style={styles.header}
              onPress={() => toggle(section.itemId)}
            >
              <Text style={styles.headerTitle} numberOfLines={1}>
                {section.title}
              </Text>
              <Text style={styles.headerMeta}>
                {expanded[section.itemId] ? "▲" : "▼"}{" "}
                {renderHeaderMeta(section)}
              </Text>
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

                {renderContacts(item)}

                {/* Akcje dla właściciela w Aktualnych */}
                {mode === "mine" && subTab === "active" && (
                  <>
                    {item.status === "pending" && (
                      <View style={styles.actions}>
                        <Pressable
                          onPress={() =>
                            confirm(
                              "Zatwierdzić?",
                              "Czy na pewno zatwierdzić tę odpowiedź?",
                              () => updateStatus(item._id, "approved")
                            )
                          }
                          style={[styles.btn, styles.btnApprove]}
                        >
                          <Text style={styles.btnText}>Zatwierdź</Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            confirm(
                              "Odrzucić?",
                              "Czy na pewno odrzucić tę odpowiedź?",
                              () => updateStatus(item._id, "rejected")
                            )
                          }
                          style={[styles.btn, styles.btnReject]}
                        >
                          <Text style={styles.btnText}>Odrzuć</Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            confirm(
                              "Archiwizować?",
                              "Przenieść do archiwum?",
                              () => updateStatus(item._id, "archived")
                            )
                          }
                          style={[styles.btn, styles.btnArchive]}
                        >
                          <Text style={styles.btnText}>Archiwizuj</Text>
                        </Pressable>
                      </View>
                    )}

                    {item.status === "approved" && (
                      <View style={styles.actions}>
                        <Pressable
                          onPress={() =>
                            confirm(
                              "Zakończyć?",
                              "Oznaczyć proces jako zakończony (przedmiot przekazany)?",
                              () => updateStatus(item._id, "completed")
                            )
                          }
                          style={[styles.btn, styles.btnDone]}
                        >
                          <Text style={styles.btnText}>
                            Oznacz jako zakończone
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            confirm(
                              "Cofnąć decyzję?",
                              "Cofnąć zatwierdzenie i odrzucić tę odpowiedź?",
                              () => updateStatus(item._id, "rejected")
                            )
                          }
                          style={[styles.btn, styles.btnReject]}
                        >
                          <Text style={styles.btnText}>Cofnij i odmów</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            ) : null
          }
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

  subTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
    flexWrap: "wrap",
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

  contactBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F3F8F3",
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
  },
  contactTitle: { fontWeight: "700", color: GlobalStyles.colors.textPrimary },
  contactLine: { color: GlobalStyles.colors.textPrimary, marginTop: 4 },

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
