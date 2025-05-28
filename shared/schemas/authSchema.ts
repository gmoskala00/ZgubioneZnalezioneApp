import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = loginSchema
  .extend({
    username: z
      .string()
      .min(3, "Username must be at least 3 letter")
      .regex(/^\S+$/, "Username cannot contain spaces"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    phoneNumber: z
      .string()
      .regex(/^\+?\d{9,15}$/, "Invalid phone number")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
