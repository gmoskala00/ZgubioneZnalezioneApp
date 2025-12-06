import { Router } from "express";
import { AuthenticatedRequest, verifyToken } from "../middleware/verifyToken";
import { claimCreateSchema } from "../../../shared/dist/schemas/ClaimSchema";
import Claim from "../models/Claim";
import FoundItem from "../models/FoundItem";
import User from "../models/User";

const router = Router();

function normPhone(s?: string) {
  return (s || "").replace(/[^\d+]/g, "");
}

async function enrichApprovedContactsForInbox(groups: any[], ownerId: string) {
  const responderIds = new Set<string>();
  for (const g of groups) {
    for (const c of g.claims) {
      if (c.status === "approved") responderIds.add(String(c.responderId));
    }
  }
  if (responderIds.size === 0) return groups;

  const responders = await User.find(
    { _id: { $in: Array.from(responderIds) } },
    { email: 1, phoneNumber: 1 }
  ).lean();
  const responderById = Object.fromEntries(
    responders.map((u: any) => [String(u._id), u])
  );

  for (const g of groups) {
    for (const c of g.claims) {
      if (c.status !== "approved") continue;
      const ru = responderById[String(c.responderId)];
      c.contactForOwner = {
        email: ru?.email,
        phone: ru?.phoneNumber || undefined,
      };
    }
  }
  return groups;
}

async function enrichApprovedContactsForSent(claims: any[]) {
  const itemIds = Array.from(new Set(claims.map((c) => String(c.itemId))));
  if (itemIds.length === 0) return claims;

  const items = await FoundItem.find(
    { _id: { $in: itemIds } },
    { contactMethod: 1, contactDetails: 1 }
  ).lean();

  const itemById = Object.fromEntries(
    items.map((i: any) => [String(i._id), i])
  );

  for (const c of claims) {
    if (c.status !== "approved") continue;

    const it = itemById[String(c.itemId)];
    const method = it?.contactMethod as "email" | "phone" | "other" | undefined;
    const details = (it?.contactDetails || "").trim();

    c.contactForResponder = {
      method: method ?? "other",
      details: details || undefined,
    };
  }

  return claims;
}

router.post(
  "/:itemId",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const { itemId } = req.params;

    const parsed = claimCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Potrzebne 2 odpowiedzi",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { answers, message } = parsed.data;

    const item = await FoundItem.findById(itemId);
    if (!item) {
      res.status(404).json({ message: "Ogłoszenie nie istnieje." });
      return;
    }
    if (String(item.createdBy) === req.user!.userId) {
      res
        .status(400)
        .json({ message: "Nie możesz odpowiadać na własne ogłoszenie." });
      return;
    }
    if (item.status === "expired" || item.status === "returned") {
      res.status(400).json({ message: "Ogłoszenie nie jest aktywne." });
      return;
    }

    const exists = await Claim.exists({
      itemId: item._id,
      responderId: req.user!.userId,
    });
    if (exists) {
      res.status(400).json({ message: "Już odpowiedziałeś na to ogłoszenie." });
      return;
    }

    const claim = await Claim.create({
      itemId: item._id,
      ownerId: item.createdBy,
      responderId: req.user!.userId,
      answers: answers.map((a) => a.trim()),
      message: message?.trim(),
      status: "pending",
      ownerUnread: true,
      responderUnread: false,
    });

    res
      .status(201)
      .json({ ok: true, message: "Odpowiedź została zapisana.", claim });
  }
);

router.get(
  "/inbox",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const ownerId = req.user!.userId;

    const allItems = await FoundItem.find({ createdBy: ownerId })
      .select("_id title status")
      .lean();

    const claims = await Claim.find({
      ownerId,
      status: {
        $in: ["pending", "approved", "rejected", "completed", "archived"],
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    const byItem: Record<string, any[]> = {};
    for (const c of claims) {
      const key = String(c.itemId);
      (byItem[key] ??= []).push(c);
    }

    let result = allItems.map((it) => ({
      itemId: String(it._id),
      itemTitle: it.title,
      itemStatus: it.status as "active" | "expired" | "returned",
      claims: byItem[String(it._id)] ?? [],
    }));

    result = await enrichApprovedContactsForInbox(result, ownerId);

    res.json(result);
  }
);

router.get(
  "/sent",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const responderId = req.user!.userId;
    let claims = await Claim.find({
      responderId,
      status: { $in: ["pending", "approved", "rejected", "completed"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const items = await FoundItem.find(
      { _id: { $in: claims.map((c) => c.itemId) } },
      { title: 1 }
    ).lean();
    const titleById = Object.fromEntries(
      items.map((i) => [String(i._id), i.title])
    );
    claims = claims.map((c) => ({
      ...c,
      itemTitle: titleById[String(c.itemId)],
    }));

    claims = await enrichApprovedContactsForSent(claims);

    res.json(claims);
  }
);

router.patch(
  "/:id/seen",
  verifyToken,
  async (req: AuthenticatedRequest, res) => {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    const role = (req.query.role as "owner" | "responder") || "owner";
    const userId = req.user!.userId;

    if (role === "owner") {
      if (String(claim.ownerId) !== userId) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      if (claim.ownerUnread) {
        claim.ownerUnread = false;
        await claim.save();
      }
    } else {
      if (String(claim.responderId) !== userId) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      if (claim.responderUnread) {
        claim.responderUnread = false;
        await claim.save();
      }
    }
    res.json({ ok: true });
  }
);

router.patch(
  "/:id/status",
  verifyToken,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const { status } = req.body as {
      status: "approved" | "rejected" | "archived" | "completed";
    };

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    if (String(claim.ownerId) !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    claim.status = status;
    claim.responderUnread = true;
    await claim.save();

    if (status === "completed") {
      await FoundItem.findByIdAndUpdate(claim.itemId, { status: "returned" });
    }

    res.json(claim);
  }
);

router.get(
  "/unread-count",
  verifyToken,
  async (req: AuthenticatedRequest, res) => {
    const { mode } = req.query as { mode?: "mine" | "responses" };
    const userId = req.user!.userId;

    if (mode === "responses") {
      const count = await Claim.countDocuments({
        responderId: userId,
        responderUnread: true,
      });
      res.json({ count });
      return;
    }
    const count = await Claim.countDocuments({
      ownerId: userId,
      ownerUnread: true,
    });
    res.json({ count });
  }
);

export default router;
