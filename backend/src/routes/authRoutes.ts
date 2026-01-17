import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User";
import {
  loginSchema,
  registerSchema,
} from "../../../shared/dist/schemas/AuthSchema";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

router.post("/register", async (req: Request, res: Response): Promise<any> => {
  const credentials = req.body;

  const result = registerSchema.safeParse(credentials);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation Error",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { username, email, password, phoneNumber } = result.data;

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email zajęty" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: "Nazwa użytkownika zajęta" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Zarejestrowano",
      token,
      user: { _id: newUser._id },
    });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<any> => {
  const credentials = req.body;

  const result = loginSchema.safeParse(credentials);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation error",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { email, password } = result.data;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Brak konta o podanym adresie email" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Złe hasło." });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Zalogowano prawidłowo",
      token,
      user: {
        _id: user?._id,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
