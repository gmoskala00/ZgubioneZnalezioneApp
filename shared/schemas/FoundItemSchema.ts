// shared/schemas/foundItemSchema.ts
import { z } from "zod";
import { foundItemCategories } from "../../models/FoundItem";

export const foundLocationSchema = z.object({
  lat: z.number({ required_error: "Latitude is required" }),
  lng: z.number({ required_error: "Longitude is required" }),
  description: z.string().min(1, "Location description is required"),
});

export const foundItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),

  dateFound: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date format",
  }),

  foundLocation: foundLocationSchema,

  categories: z
    .array(z.enum(foundItemCategories))
    .min(1, "Select at least one category"),

  // dokładnie 2 pytania, każde min 3–5 znaków (dobierz jak chcesz)
  securityQuestions: z
    .tuple([z.string().min(3), z.string().min(3)])
    .refine(([a, b]) => a.trim() !== b.trim(), {
      message: "Questions must be different",
      path: [], // ogólne
    }),

  contactMethod: z.enum(["email", "phone", "other"], {
    required_error: "Contact method is required",
  }),
  contactDetails: z.string().min(1, "Contact details are required"),

  createdBy: z.string().min(1, "User ID is required"),

  status: z.enum(["active", "expired", "returned"]).optional(),
});
