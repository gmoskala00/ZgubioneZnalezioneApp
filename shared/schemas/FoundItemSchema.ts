import { z } from "zod";
import { FOUND_ITEM_CATEGORIES } from "../constants/categories";

export const foundLocationSchema = z.object({
  lat: z.number({ required_error: "Latitude is required" }),
  lng: z.number({ required_error: "Longitude is required" }),
  description: z.string().min(1, "Location description is required"),
});

export const foundItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),

  dateFound: z.string().refine((v: string) => !isNaN(Date.parse(v)), {
    message: "Invalid date format",
  }),

  foundLocation: foundLocationSchema,

  categories: z
    .array(z.enum(FOUND_ITEM_CATEGORIES))
    .min(1, "Select at least one category"),

  securityQuestions: z
    .tuple([z.string().min(3), z.string().min(3)])
    .refine(([a, b]: [string, string]) => a.trim() !== b.trim(), {
      message: "Questions must be different",
      path: [1],
    }),

  contactMethod: z.enum(["email", "phone", "other"]),
  contactDetails: z.string().min(1, "Contact details are required"),
  createdBy: z.string().min(1, "User ID is required"),
  status: z.enum(["active", "expired", "returned"]).optional(),
});
