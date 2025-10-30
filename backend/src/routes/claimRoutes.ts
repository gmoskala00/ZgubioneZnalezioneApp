import { Router } from "express";
import { AuthenticatedRequest, verifyToken } from "../middleware/verifyToken";
import Claim from "../models/Claim";
import FoundItem from "../models/FoundItem";

const router = Router();

router.post("/:itemId", verifyToken, async (req: AuthenticatedRequest, res) => {
  const { itemId } = req.params;
  const { answers, message } = req.body as {
    answers: string[];
    message?: string;
  };

  if (
    !Array.isArray(answers) ||
    answers.length !== 2 ||
    answers.some((a) => !a.trim())
  ) {
    res.status(400).json({ message: "Podaj dwie odpowiedzi." });
    return;
  }

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
  if (item.status === "expired") {
    res.status(400).json({ message: "Ogłoszenie wygasło." });
    return;
  }

  const claim = await Claim.create({
    itemId: item._id,
    ownerId: item.createdBy,
    responderId: req.user!.userId,
    answers: answers.map((a) => a.trim()) as [string, string],
    message: message?.trim(),
    status: "pending",
    ownerUnread: true,
    responderUnread: false,
  });

  res
    .status(201)
    .json({ ok: true, message: "Odpowiedź została zapisana.", claim });
});

router.get("/inbox", verifyToken, async (req: AuthenticatedRequest, res) => {
  const ownerId = req.user!.userId;
  const allItems = await FoundItem.find({ createdBy: ownerId }).lean();

  const claims = await Claim.find({
    ownerId,
    status: {
      $in: ["pending", "approved", "rejected", "completed", "archived"],
    },
  })
    .sort({ createdAt: -1 })
    .lean();

  const byItem: Record<string, any[]> = {};
  claims.forEach((c) => {
    const k = c.itemId.toString();
    (byItem[k] ||= []).push(c);
  });

  const result = allItems.map((item) => ({
    itemId: item._id.toString(),
    itemTitle: item.title,
    itemStatus: item.status,
    claims: byItem[item._id.toString()] ?? [],
  }));

  res.json(result);
});

router.get("/sent", verifyToken, async (req: AuthenticatedRequest, res) => {
  const responderId = req.user!.userId;
  const claims = await Claim.find({
    responderId,
    status: {
      $in: ["pending", "approved", "rejected", "completed", "archived"],
    },
  })
    .sort({ createdAt: -1 })
    .lean();

  const items = await FoundItem.find(
    { _id: { $in: claims.map((c) => c.itemId) } },
    { title: 1 }
  ).lean();

  const titleById = Object.fromEntries(
    items.map((i) => [i._id.toString(), i.title])
  );
  res.json(
    claims.map((c) => ({ ...c, itemTitle: titleById[c.itemId.toString()] }))
  );
});

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
