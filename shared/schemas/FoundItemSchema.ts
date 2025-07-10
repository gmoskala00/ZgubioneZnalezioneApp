import { z } from "zod";

export const foundLocationSchema = z.object({
  lat: z.number({
    required_error: "Latitude is required",
  }),
  lng: z.number({
    required_error: "Longitude is required",
  }),
  description: z.string().min(1, "Location description is required"),
});

export const foundItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url("Must be a valid URL").optional(),

  dateFound: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),

  foundLocation: foundLocationSchema,

  stillHasItem: z.boolean(),

  placeWhereLeft: z.string().optional().or(z.literal("")),

  contactMethod: z.enum(["email", "phone", "other"], {
    required_error: "Contact method is required",
  }),

  contactDetails: z.string().min(1, "Contact details are required"),

  createdBy: z.string().min(1, "User ID is required"),

  status: z.enum(["active", "expired", "returned"]).optional(),
});
