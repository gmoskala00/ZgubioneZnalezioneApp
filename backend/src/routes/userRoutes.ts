import { Request, Response, Router } from "express";
import User from "../models/User";
import { AuthenticatedRequest, verifyToken } from "../middleware/verifyToken";
import { userUpdateSchema } from "../../../shared/dist/schemas/UserUpdateSchema";

const router = Router();

router.get(
  "/me",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const user = await User.findById(req.user!.userId).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user: ", (error as Error).message);
      return res.status(500).json({ message: "Server error " });
    }
  }
);

router.patch(
  "/me",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, email, phoneNumber } = parsed.data;

    try {
      const user = await User.findById(req.user!.userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (typeof username !== "undefined") user.username = username;
      if (typeof email !== "undefined") user.email = email;
      if (typeof phoneNumber !== "undefined") {
        user.phoneNumber = phoneNumber || undefined;
      }

      await user.save();

      const safeUser = user.toObject();
      delete (safeUser as any).password;

      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error updating user: ", (error as Error).message);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user: ", (error as Error).message);
    return res.status(500).json({ message: "Server error " });
  }
});

router.post(
  "/push-token",
  verifyToken,
  async (req: AuthenticatedRequest, res): Promise<any> => {
    const { token } = req.body as { token?: string };
    console.log("Saving push token for user", req.user!.userId, token);
    if (!token) return res.status(400).json({ message: "Token required" });

    await User.findByIdAndUpdate(req.user!.userId, { pushToken: token });
    res.json({ ok: true });
  }
);

export default router;
