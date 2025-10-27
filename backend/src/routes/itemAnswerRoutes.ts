import { Router, Response } from "express";
import FoundItem from "../models/FoundItem";
import ItemAnswer from "../models/ItemAnswer";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import { itemAnswerCreateSchema } from "../../../shared/dist/schemas/ItemAnswerSchema";

const answersRouter = Router({ mergeParams: true });

answersRouter.post(
  "/",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };

    const parsed = itemAnswerCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          message: "Validation error",
          errors: parsed.error.flatten().fieldErrors,
        });
      return;
    }

    const item = await FoundItem.findById(id).select("_id status");
    if (!item) {
      res.status(404).json({ message: "Ogłoszenie nie istnieje." });
      return;
    }
    if (item.status === "expired") {
      res.status(400).json({ message: "Ogłoszenie wygasło." });
      return;
    }

    await ItemAnswer.create({
      itemId: item._id,
      answers: parsed.data.answers.map((a) => a.trim()),
      answeredBy: req.user!.userId,
    });

    res.status(201).json({ ok: true, message: "Odpowiedź zapisana." });
  }
);

answersRouter.get(
  "/",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };

    const item = await FoundItem.findById(id).select("_id createdBy");
    if (!item) {
      res.status(404).json({ message: "Ogłoszenie nie istnieje." });
      return;
    }
    if (String(item.createdBy) !== req.user!.userId) {
      res.status(403).json({ message: "Brak dostępu." });
      return;
    }

    const list = await ItemAnswer.find({ itemId: item._id })
      .sort({ createdAt: -1 })
      .select("_id answers answeredBy createdAt");

    res.json({ items: list });
  }
);

export default answersRouter;
