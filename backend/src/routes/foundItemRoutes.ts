import { Router, Request, Response } from "express";
import FoundItem from "../models/FoundItem";
import { foundItemSchema } from "../../../shared/schemas/foundItemSchema";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = Router();

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

router.get("/", async (_req: Request, res: Response) => {
  try {
    const items = await FoundItem.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    console.error("Read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const item = await FoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete(
  "/:id",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const item = await FoundItem.findById(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });

      if (item.createdBy.toString() !== req.user?.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await item.deleteOne();
      res.status(200).json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/:id",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const item = await FoundItem.findById(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });

      if (item.createdBy.toString() !== req.user?.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

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

      Object.assign(item, result.data);
      await item.save();

      res.status(200).json(item);
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
