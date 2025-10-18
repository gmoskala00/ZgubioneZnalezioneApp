import { Request, Response, Router } from "express";
import User from "../models/User";
import { AuthenticatedRequest, verifyToken } from "../middleware/verifyToken";

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

export default router;
