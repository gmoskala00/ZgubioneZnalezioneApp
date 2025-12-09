import { useCallback, useEffect, useMemo, useState } from "react";
import { Api } from "../services/api";

export type ModeKey = "mine" | "responses";
export type SubKey = "active" | "closed";

export type ClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "archived"
  | "completed";

export type Claim = {
  _id: string;
  itemId: string;
  itemTitle?: string;
  itemStatus?: "active" | "expired" | "returned" | "archived";
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
    method?: "email" | "phone" | "other";
    details?: string;
  };
};

export type InboxGroup = {
  itemId: string;
  itemTitle: string;
  itemStatus: "active" | "expired" | "returned" | "archived";
  claims: Claim[];
};

type Section = {
  itemId: string;
  title: string;
  data: Claim[];
  itemStatus?: InboxGroup["itemStatus"];
};

export function useInbox(mode: ModeKey, subTab: SubKey) {
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
    async (first = false) => {
      try {
        if (first) setIsInitialLoading(true);
        else setIsRefreshing(true);

        if (mode === "mine") await fetchMine();
        else await fetchResponses();
      } catch (e) {
        console.error(e);
      } finally {
        if (first) setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [mode, fetchMine, fetchResponses]
  );

  useEffect(() => {
    fetchCurrent(true);
  }, [fetchCurrent]);

  const sections: Section[] = useMemo(() => {
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
          itemStatus: g.itemStatus,
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
      const ACTIVE: ClaimStatus[] = ["pending", "approved"];
      const CLOSED: ClaimStatus[] = ["rejected", "completed", "archived"];

      const filtered = claimsSent.filter((c) =>
        subTab === "active"
          ? ACTIVE.includes(c.status)
          : CLOSED.includes(c.status)
      );

      const map = new Map<
        string,
        {
          title: string;
          claims: Claim[];
          itemStatus?: InboxGroup["itemStatus"];
        }
      >();

      filtered.forEach((c) => {
        const existing = map.get(c.itemId);
        if (!existing) {
          map.set(c.itemId, {
            title: c.itemTitle ?? "Ogłoszenie",
            claims: [c],
            itemStatus: c.itemStatus,
          });
        } else {
          existing.claims.push(c);
          if (!existing.itemStatus && c.itemStatus) {
            existing.itemStatus = c.itemStatus;
          }
        }
      });

      return Array.from(map.entries())
        .map(([itemId, g]) => ({
          itemId,
          title: g.title,
          itemStatus: g.itemStatus,
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

  const unreadByItem = useMemo(() => {
    const out: Record<string, number> = {};
    for (const sec of sections) {
      const count = sec.data.filter((c) =>
        mode === "mine" ? c.ownerUnread : c.responderUnread
      ).length;
      if (count > 0) out[sec.itemId] = count;
    }
    return out;
  }, [sections, mode]);

  const markSectionSeen = useCallback(
    async (itemId: string) => {
      const sec = sections.find((s) => s.itemId === itemId);
      if (!sec) return;
      const unreadClaims = sec.data.filter((c) =>
        mode === "mine" ? c.ownerUnread : c.responderUnread
      );
      if (unreadClaims.length === 0) return;

      for (const c of unreadClaims) {
        try {
          await Api.patch(
            `/api/claims/${c._id}/seen?role=${
              mode === "mine" ? "owner" : "responder"
            }`
          );
        } catch (e) {
          console.log("mark seen error", e);
        }
      }
      fetchCurrent(false);
    },
    [sections, mode, fetchCurrent]
  );

  const toggleSection = useCallback(
    (itemId: string) => {
      const willOpen = !expanded[itemId];
      setExpanded((prev) => ({ ...prev, [itemId]: willOpen }));
      if (willOpen) {
        markSectionSeen(itemId);
      }
    },
    [expanded, markSectionSeen]
  );

  const onRefresh = useCallback(() => {
    fetchCurrent(false);
  }, [fetchCurrent]);

  const refetchCurrent = useCallback(
    (useInitial = true) => {
      fetchCurrent(useInitial);
    },
    [fetchCurrent]
  );

  return {
    sections,
    isInitialLoading,
    isRefreshing,
    onRefresh,
    refetchCurrent,
    expanded,
    toggleSection,
    unreadByItem,
  };
}
