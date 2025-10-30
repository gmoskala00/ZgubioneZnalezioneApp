import { Router, Request, Response } from "express";
import FoundItem from "../models/FoundItem";
import { foundItemSchema } from "../../../shared/dist/schemas/FoundItemSchema";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = Router();

function fold(s: string) {
  return s
    ?.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
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
    const items = await FoundItem.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(items);
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/bbox", async (req: Request, res: Response): Promise<void> => {
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
    status: { $nin: ["expired", "returned"] },
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

export default router;
