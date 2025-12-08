import { Router, Request, Response } from "express";
import FoundItem from "../models/FoundItem";
import Claim from "../models/Claim";
import { foundItemSchema } from "../../../shared/dist/schemas/FoundItemSchema";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import { fold } from "../utils/fold";

const router = Router();

const EXPIRE_AFTER_DAYS = 30;

async function expireOldItems() {
  const cutoff = new Date(Date.now() - EXPIRE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  try {
    await FoundItem.updateMany(
      {
        status: "active",
        $expr: {
          $lt: [
            {
              $ifNull: [
                "$renewDate",
                { $ifNull: ["$createdAt", "$dateFound"] },
              ],
            },
            cutoff,
          ],
        },
      },
      { status: "expired" }
    );
  } catch (err) {
    console.error("Expire old items error:", err);
  }
}

router.post(
  "/",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    const result = foundItemSchema.safeParse({
      ...req.body,
      createdBy: req.user?.userId,
    });

    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.flatten().fieldErrors,
      });
    }

    try {
      const newItem = new FoundItem(result.data);
      await newItem.save();
      res.status(201).json(newItem);
    } catch (err) {
      console.error("Create error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    await expireOldItems();

    const items = await FoundItem.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(items);
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/bbox", async (req: Request, res: Response): Promise<void> => {
  await expireOldItems();

  const n = Number(req.query.n);
  const e = Number(req.query.e);
  const s = Number(req.query.s);
  const w = Number(req.query.w);
  const limit = Math.min(Number(req.query.limit ?? 300), 500);

  const q = (req.query.q as string | undefined)?.trim();
  const catsCsv = (req.query.categories as string | undefined)?.trim();
  const categories = catsCsv
    ? catsCsv
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  if ([n, e, s, w].some(Number.isNaN)) {
    res.status(400).json({ message: "bbox params required: n,e,s,w" });
    return;
  }

  const filter: any = {
    "foundLocation.lat": { $gte: s, $lte: n },
    "foundLocation.lng": { $gte: w, $lte: e },
    status: { $nin: ["expired", "returned", "archived"] },
  };

  if (categories.length > 0) {
    filter.categories = { $in: categories };
  }

  if (q) {
    const tokens = fold(q).split(/\s+/).filter(Boolean);
    filter.$and = (filter.$and ?? []).concat(
      tokens.map((t) => ({
        titleFolded: {
          $regex: t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      }))
    );
  }

  try {
    const items = await FoundItem.find(filter)
      .select(
        "_id title description dateFound foundLocation categories createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ items });
  } catch (err) {
    console.error("BBox error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await FoundItem.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Ogłoszenie nie istnieje." });
      return;
    }
    res.json(item);
  } catch (err) {
    console.error("Get by id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch(
  "/:id/archive",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user!.userId;
      const item = await FoundItem.findById(req.params.id);

      if (!item) {
        return res.status(404).json({ message: "Ogłoszenie nie istnieje." });
      }

      if (String(item.createdBy) !== userId) {
        return res.status(403).json({ message: "Brak uprawnień." });
      }

      if (item.status !== "active") {
        return res.status(400).json({
          message:
            "Ogłoszenie nie jest aktywne i nie może zostać zarchiwizowane.",
        });
      }

      item.status = "archived";
      await item.save();

      await Claim.updateMany(
        { itemId: item._id, status: { $in: ["pending", "approved"] } },
        {
          status: "archived",
          responderUnread: true,
        }
      );

      return res.json({
        ok: true,
        message: "Ogłoszenie zostało zarchiwizowane.",
      });
    } catch (err) {
      console.error("Archive item error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.patch(
  "/:id/renew",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user!.userId;
      const item = await FoundItem.findById(req.params.id);

      if (!item) {
        return res.status(404).json({ message: "Ogłoszenie nie istnieje." });
      }

      if (String(item.createdBy) !== userId) {
        return res.status(403).json({ message: "Brak uprawnień." });
      }

      if (item.status !== "expired") {
        return res.status(400).json({
          message: "Można odnowić tylko ogłoszenia, które wygasły.",
        });
      }

      item.status = "active";
      item.renewDate = new Date();

      await item.save();

      return res.json({
        ok: true,
        message: "Ogłoszenie zostało odnowione i jest znów aktywne.",
      });
    } catch (err) {
      console.error("Renew item error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
