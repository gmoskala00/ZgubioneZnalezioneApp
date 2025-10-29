import { Router, Request, Response } from "express";
import { AuthenticatedRequest, verifyToken } from "../middleware/verifyToken";
import Claim from "../models/Claim";
import FoundItem from "../models/FoundItem";

const router = Router();

/**
 * POST /api/claims/:itemId
 * Utworzenie odpowiedzi (claim) – dokładnie jeden claim na (itemId,responderId)
 */
router.post(
  "/:itemId",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { itemId } = req.params;
    const { answers, message } = req.body as {
      answers: string[];
      message?: string;
    };

    // walidacja odpowiedzi
    if (
      !Array.isArray(answers) ||
      answers.length !== 2 ||
      answers.some((a) => !a || !a.trim())
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
    // blokada odpowiadania na własne ogłoszenie
    if (String(item.createdBy) === req.user!.userId) {
      res
        .status(400)
        .json({ message: "Nie możesz odpowiadać na własne ogłoszenie." });
      return;
    }
    // dokładnie jeden claim per (item,responder)
    const exists = await Claim.findOne({
      itemId: item._id,
      responderId: req.user!.userId,
    }).lean();
    if (exists) {
      res.status(409).json({ message: "Już odpowiedziałeś na to ogłoszenie." });
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

/**
 * GET /api/claims/inbox
 * Odebrane (dla właściciela): ZWRACA WSZYSTKIE JEGO OGŁOSZENIA, nawet z 0 odpowiedzi.
 * Struktura: [{ itemId, itemTitle, itemStatus, claims: Claim[] }]
 */
router.get(
  "/inbox",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const ownerId = req.user!.userId;

    // 1) Wszystkie ogłoszenia użytkownika (z tytułem i statusem)
    const allItems = await FoundItem.find({ createdBy: ownerId })
      .select("_id title status")
      .lean();

    // 2) Wszystkie claims do tych ogłoszeń
    const claims = await Claim.find({
      ownerId,
      status: {
        $in: ["pending", "approved", "rejected", "completed", "archived"],
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    // 3) Grupowanie claims po itemId
    const claimsByItem = claims.reduce((acc, claim) => {
      const key = claim.itemId.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(claim);
      return acc;
    }, {} as Record<string, any[]>);

    // 4) Zlepienie w wynik: KAŻDY item -> claims (nawet pusty)
    const result = allItems.map((item) => ({
      itemId: item._id.toString(),
      itemTitle: item.title,
      itemStatus: item.status as "active" | "returned" | "expired",
      claims: claimsByItem[item._id.toString()] ?? [],
    }));

    res.json(result);
  }
);

/**
 * GET /api/claims/sent
 * Wysłane (dla zgłaszającego) – płaska lista claimów użytkownika + tytuł ogłoszenia
 */
router.get(
  "/sent",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const responderId = req.user!.userId;

    const claims = await Claim.find({
      responderId,
      status: {
        $in: ["pending", "approved", "rejected", "archived", "completed"],
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
      claims.map((c) => ({
        ...c,
        itemTitle: titleById[c.itemId.toString()],
      }))
    );
  }
);

/**
 * GET /api/claims/archived
 */
router.get(
  "/archived",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

/**
 * GET /api/claims/completed
 */
router.get(
  "/completed",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

/**
 * PATCH /api/claims/:id/status
 * Zmiana statusu przez właściciela ogłoszenia
 */
router.patch(
  "/:id/status",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
