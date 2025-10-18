import { Schema, model, Document } from "mongoose";

const categoryEnum = [
  "keys",
  "wallet",
  "phone",
  "electronics",
  "documents",
  "clothing",
  "jewelry",
  "bag",
  "pet",
  "other",
] as const;

export interface IFoundItem extends Document {
  title: string;
  description: string;
  dateFound: Date;
  foundLocation: { lat: number; lng: number; description: string };
  categories: (typeof categoryEnum)[number][];
  securityQuestions: [string, string];
  contactMethod: "email" | "phone" | "other";
  contactDetails: string;
  createdBy: Schema.Types.ObjectId;
  status?: "active" | "expired" | "returned";
}

const foundItemSchema = new Schema<IFoundItem>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    dateFound: { type: Date, required: true, default: Date.now },
    foundLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      description: { type: String, required: true },
    },
    categories: {
      type: [String],
      enum: categoryEnum,
      required: true,
      validate: [(v: string[]) => v.length > 0, "At least one category"],
    },
    securityQuestions: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length === 2, "Exactly two questions"],
    },
    contactMethod: {
      type: String,
      enum: ["email", "phone", "other"],
      required: true,
    },
    contactDetails: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["active", "expired", "returned"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default model<IFoundItem>("FoundItem", foundItemSchema);
