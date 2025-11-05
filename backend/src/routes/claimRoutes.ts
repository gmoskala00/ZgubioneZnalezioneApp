import { Router } from "express";
import { AuthenticatedRequest, verifyToken } from "../middleware/verifyToken";
import { claimCreateSchema } from "../../../shared/dist/schemas/ClaimSchema";
import Claim from "../models/Claim";
import FoundItem from "../models/FoundItem";
import User from "../models/User";
import { sendExpoPush } from "../utils/push";

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
    { createdBy: 1, contactMethod: 1, contactDetails: 1 }
  ).lean();

  const itemById = Object.fromEntries(
    items.map((i: any) => [String(i._id), i])
  );
  const ownerIds = Array.from(
    new Set(items.map((i: any) => String(i.createdBy)))
  );

  const owners = await User.find(
    { _id: { $in: ownerIds } },
    { email: 1, phoneNumber: 1 }
  ).lean();
  const ownerById = Object.fromEntries(
    owners.map((u: any) => [String(u._id), u])
  );

  for (const c of claims) {
    if (c.status !== "approved") continue;
    const it = itemById[String(c.itemId)];
    const owner = ownerById[String(it?.createdBy)];
    const method = it?.contactMethod as "email" | "phone" | "other" | undefined;
    const details = (it?.contactDetails || "").trim();

    let showPhone: string | undefined;
    let showEmail: string | undefined;

    if (method === "phone") {
      const a = normPhone(details);
      const b = normPhone(owner?.phoneNumber);
      if (a) {
        if (a === b) {
          showPhone = details;
        } else {
          showPhone = details;
        }
      } else if (owner?.phoneNumber) {
        showPhone = owner.phoneNumber;
      }
      showEmail = owner?.email;
    } else if (method === "email") {
      showEmail = details || owner?.email;
      showPhone = owner?.phoneNumber;
    } else {
      showEmail = owner?.email;
      showPhone = owner?.phoneNumber;
      c.ownerContactOther = details;
    }

    c.contactForResponder = {
      email: showEmail,
      phone: showPhone,
      method: method || "other",
      detailsFromForm: details || undefined,
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

    const owner = await User.findById(item.createdBy).lean();
    if (owner?.pushToken) {
      console.log("sending push to", owner.pushToken);
      sendExpoPush(
        owner.pushToken,
        "Nowa odpowiedź na ogłoszenie",
        `Ktoś odpowiedział na: ${item.title}`,
        {
          type: "claim:new",
          itemId: String(item._id),
          claimId: String(claim._id),
        }
      ).catch(console.error);
    }

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

    const responderUser = await User.findById(claim.responderId).lean();
    if (responderUser?.pushToken) {
      const body =
        status === "approved"
          ? "Twoja odpowiedź została zaakceptowana."
          : status === "rejected"
          ? "Twoja odpowiedź została odrzucona."
          : status === "completed"
          ? "Właściciel oznaczył ogłoszenie jako zakończone."
          : "Aktualizacja zgłoszenia.";
      sendExpoPush(responderUser.pushToken, "Aktualizacja odpowiedzi", body);
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
