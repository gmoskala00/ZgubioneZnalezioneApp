import { z } from "zod";

export const userUpdateSchema = z.object({
  username: z.string().min(3, "Minimum 3 znaki").optional(),
  email: z.string().email("Nieprawidłowy email").optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?\d{9,15}$/, "Podaj poprawny numer telefonu")
    .optional()
    .or(z.literal("")),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
