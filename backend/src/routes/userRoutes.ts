import { Request, Response, Router } from "express";
import User from "../models/User";

const router = Router();

router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  console.log("HEHE");
  const userId = req.params.id;

  console.log("USER ID: ", userId);

  try {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user: ", (error as Error).message);
    return res.status(500).json({ message: "Server error " });
  }
});

export default router;
