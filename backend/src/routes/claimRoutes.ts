import { Router } from "express";
import { AuthenticatedRequest, verifyToken } from "../middleware/verifyToken";
import Claim from "../models/Claim";
import FoundItem from "../models/FoundItem";

const router = Router();

// ✅ Utworzenie odpowiedzi (Claim)
router.post(
  "/:itemId",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<void> => {
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

    if (item.status === "expired") {
      res.status(400).json({ message: "Ogłoszenie wygasło." });
      return;
    }

    const claim = await Claim.create({
      itemId: item._id,
      ownerId: item.createdBy,
      responderId: req.user!.userId,
      answers: answers.map((a) => a.trim()),
      message: message?.trim(),
      status: "pending",
    });

    res
      .status(201)
      .json({ ok: true, message: "Odpowiedź została zapisana.", claim });
  }
);

// ✅ Odebrane (dla właściciela)
router.get(
  "/inbox",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const ownerId = req.user!.userId;
    const claims = await Claim.find({
      ownerId,
      status: { $in: ["pending", "approved", "rejected"] },
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
  }
);

// ✅ Wysłane (dla zgłaszającego)
router.get(
  "/sent",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const responderId = req.user!.userId;
    const claims = await Claim.find({
      responderId,
      status: { $in: ["pending", "approved", "rejected"] },
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
  }
);

// ✅ Archiwum
router.get(
  "/archived",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const userId = req.user!.userId;
    const claims = await Claim.find({
      $or: [{ ownerId: userId }, { responderId: userId }],
      status: "archived",
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(claims);
  }
);

// ✅ Zakończone
router.get(
  "/completed",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const userId = req.user!.userId;
    const claims = await Claim.find({
      $or: [{ ownerId: userId }, { responderId: userId }],
      status: "completed",
    })
      .sort({ updatedAt: -1 })
      .lean();
    res.json(claims);
  }
);

// ✅ Zmiana statusu
router.patch(
  "/:id/status",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<void> => {
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
    await claim.save();
    res.json(claim);
  }
);

export default router;
