import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { GlobalStyles } from "../../constants/style";
import { labelStatus } from "../../i18n/labels";
import type { Claim, ClaimStatus, ModeKey, SubKey } from "../../hooks/useInbox";

type Props = {
  claim: Claim;
  mode: ModeKey;
  subTab: SubKey;
  onAction?: (
    action: "approved" | "rejected" | "archived" | "completed"
  ) => void;
};

export const ClaimCard: React.FC<Props> = ({
  claim,
  mode,
  subTab,
  onAction,
}) => {
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
              <Text selectable style={styles.contactLine}>
                E-mail: {c.contactForOwner.email}
              </Text>
            )}
            {!!c.contactForOwner?.phone && (
              <Text selectable style={styles.contactLine}>
                Telefon: {c.contactForOwner.phone}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.contactTitle}>
              Dane kontaktowe właściciela:
            </Text>
            {c.contactForResponder?.details && (
              <Text selectable style={styles.contactLine}>
                {c.contactForResponder.method === "phone"
                  ? "Telefon"
                  : c.contactForResponder.method === "email"
                  ? "E-mail"
                  : "Kontakt"}
                : {` ${c.contactForResponder.details}`}
              </Text>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={getStatusTextStyle(claim.status)}>
          {labelStatus(claim.status)}
        </Text>
        <Text style={styles.date}>
          {dayjs(claim.createdAt).locale("pl").format("D MMM YYYY, HH:mm")}
        </Text>
      </View>

      <Text style={styles.q}>Pytanie 1 — odpowiedź:</Text>
      <Text style={styles.a}>{claim.answers[0]}</Text>
      <Text style={styles.q}>Pytanie 2 — odpowiedź:</Text>
      <Text style={styles.a}>{claim.answers[1]}</Text>

      {claim.message ? <Text style={styles.msg}>„{claim.message}”</Text> : null}

      {renderContacts(claim)}

      {mode === "mine" && subTab === "active" && onAction ? (
        <>
          {claim.status === "pending" && (
            <View style={styles.actions}>
              <Pressable
                onPress={() => onAction("approved")}
                style={[styles.btn, styles.btnApprove]}
              >
                <Text style={styles.btnText}>Zatwierdź</Text>
              </Pressable>
              <Pressable
                onPress={() => onAction("rejected")}
                style={[styles.btn, styles.btnReject]}
              >
                <Text style={styles.btnText}>Odrzuć</Text>
              </Pressable>
            </View>
          )}

          {claim.status === "approved" && (
            <View style={styles.actions}>
              <Pressable
                onPress={() => onAction("completed")}
                style={[styles.btn, styles.btnDone]}
              >
                <Text style={styles.btnText}>Oznacz jako zakończone</Text>
              </Pressable>
              <Pressable
                onPress={() => onAction("rejected")}
                style={[styles.btn, styles.btnReject]}
              >
                <Text style={styles.btnText}>Cofnij i odmów</Text>
              </Pressable>
            </View>
          )}
        </>
      ) : null}
    </View>
  );
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
      ? "#8e8e8e"
      : GlobalStyles.colors.primaryDark,
});

const styles = StyleSheet.create({
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
  btnDone: { backgroundColor: "#1565C0" },
});
