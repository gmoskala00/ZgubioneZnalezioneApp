import { Router } from "express";
import User from "../models/User";

const router = Router();

router.post("/register", async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: "Missing Required Fields" });
  }

  try {
    const existing = await User.findOne({ email });

    if (existing) {
      res.status(409).json({ message: "User with given email already exist" });
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

export default router;
