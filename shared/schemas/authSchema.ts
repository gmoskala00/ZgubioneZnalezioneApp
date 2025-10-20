import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = loginSchema
  .extend({
    username: z.string().min(3).regex(/^\S+$/),
    password: z.string().min(6).regex(/\d/),
    confirmPassword: z.string(),
    phoneNumber: z
      .string()
      .regex(/^\+?\d{9,15}$/)
      .optional()
      .or(z.literal("")),
  })
  .refine((data: any) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
