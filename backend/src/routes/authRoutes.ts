import { Router, Request, Response } from "express";
import User from "../models/User";

const router = Router();

router.post("/register", async (req: Request, res: Response): Promise<any> => {
  const { username, email, password, phoneNumber } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Missing Required Fields" });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const newUser = new User({
      username,
      email,
      password,
      phoneNumber,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered succesfully" });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<any> => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Missing Required Fields" });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Not Found account with given email" });
    }

    if (password !== user.password) {
      return res.status(401).json({ message: "Wrong password." });
    }

    res.status(200).json({
      message: "Logged in Successfully",
      user: {
        _id: user?._id,
        email: user?.email,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
