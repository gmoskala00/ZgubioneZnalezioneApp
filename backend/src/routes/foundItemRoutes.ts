import { Router, Request, Response } from "express";
import FoundItem from "../models/FoundItem";
import { foundItemSchema } from "../../../shared/dist/schemas/FoundItemSchema";
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

export default router;
