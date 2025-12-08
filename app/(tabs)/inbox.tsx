import { useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
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
import { GlobalStyles } from "../../constants/style";
import { Api } from "../../services/api";
import { useInbox, ModeKey, SubKey } from "../../hooks/useInbox";
import { ClaimCard } from "../../components/UI/ClaimCard";

const InboxScreen = () => {
  const [mode, setMode] = useState<ModeKey>("mine");
  const [subTab, setSubTab] = useState<SubKey>("active");

  const {
    sections,
    isInitialLoading,
    isRefreshing,
    onRefresh,
    refetchCurrent,
    expanded,
    toggleSection,
    unreadByItem,
  } = useInbox(mode, subTab);

  useFocusEffect(
    useCallback(() => {
      refetchCurrent();
    }, [mode, subTab, refetchCurrent])
  );

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
    refetchCurrent();
  };

  const archiveItem = async (itemId: string) => {
    await Api.patch(`/api/found-items/${itemId}/archive`);
    refetchCurrent();
  };

  const handleArchiveItemWithConfirm = (itemId: string) => {
    confirm(
      "Zarchiwizować ogłoszenie?",
      "Ogłoszenie zniknie z listy aktywnych, a powiązane odpowiedzi zostaną oznaczone jako zarchiwizowane.",
      () => archiveItem(itemId)
    );
  };

  const handleActionWithConfirm = (
    claimId: string,
    action: "approved" | "rejected" | "archived" | "completed"
  ) => {
    if (action === "approved") {
      confirm("Zatwierdzić?", "Czy na pewno zatwierdzić tę odpowiedź?", () =>
        updateStatus(claimId, "approved")
      );
    } else if (action === "rejected") {
      confirm("Odrzucić?", "Czy na pewno odrzucić tę odpowiedź?", () =>
        updateStatus(claimId, "rejected")
      );
    } else if (action === "completed") {
      confirm(
        "Zakończyć?",
        "Oznaczyć proces jako zakończony (przedmiot przekazany)?",
        () => updateStatus(claimId, "completed")
      );
    } else if (action === "archived") {
      confirm("Zarchiwizować?", "Czy na pewno zarchiwizować?", () =>
        updateStatus(claimId, "archived")
      );
    }
  };

  const renderHeaderMeta = (section: { data: any[] }) => {
    if (mode === "responses") return "Twoja odpowiedź";
    const count = section.data.length;
    return `${count} odpowied${count === 1 ? "ź" : "zi"}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: GlobalStyles.colors.background }}>
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
          renderSectionHeader={({ section }) => (
            <Pressable
              style={styles.header}
              onPress={() => toggleSection(section.itemId)}
            >
              <Text style={styles.headerTitle} numberOfLines={1}>
                {section.title}
              </Text>
              <View style={styles.headerRight}>
                {unreadByItem[section.itemId] ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadByItem[section.itemId]}
                    </Text>
                  </View>
                ) : null}

                {/* przycisk Archiwizuj tylko dla Moje ogłoszenia / Aktualne */}
                {mode === "mine" && subTab === "active" && (
                  <Pressable
                    onPress={() => handleArchiveItemWithConfirm(section.itemId)}
                    style={styles.headerArchiveBtn}
                  >
                    <Text style={styles.headerArchiveText}>Archiwizuj</Text>
                  </Pressable>
                )}

                <Text style={styles.headerMeta}>
                  {expanded[section.itemId] ? "▲" : "▼"}{" "}
                  {renderHeaderMeta(section)}
                </Text>
              </View>
            </Pressable>
          )}
          renderItem={({ item, section }) =>
            expanded[section.itemId] ? (
              <ClaimCard
                claim={item}
                mode={mode}
                subTab={subTab}
                onAction={(action) => handleActionWithConfirm(item._id, action)}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text
                style={{
                  color: GlobalStyles.colors.textSecondary,
                  fontSize: 18,
                }}
              >
                Brak elementów
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default InboxScreen;

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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerMeta: { color: GlobalStyles.colors.textSecondary },
  unreadBadge: {
    backgroundColor: "#2e7d32",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: "50%",
  },
  headerArchiveBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    backgroundColor: GlobalStyles.colors.card,
  },
  headerArchiveText: {
    fontSize: 12,
    color: GlobalStyles.colors.textSecondary,
  },
});
