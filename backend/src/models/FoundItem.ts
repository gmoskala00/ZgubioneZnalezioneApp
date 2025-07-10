import { Schema, model, Document } from "mongoose";

export interface IFoundItem extends Document {
  title: string;
  description: string;
  imageUrl?: string;
  dateFound: Date;
  foundLocation: {
    lat: number;
    lng: number;
    description: string;
  };
  stillHasItem: boolean;
  placeWhereLeft?: string;
  contactMethod: "email" | "phone" | "other";
  contactDetails: string;
  createdBy: Schema.Types.ObjectId;
}

const foundItemSchema = new Schema<IFoundItem>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    dateFound: {
      type: Date,
      required: true,
      default: Date.now,
    },
    foundLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      description: { type: String, required: true },
    },
    stillHasItem: {
      type: Boolean,
      required: true,
    },
    placeWhereLeft: {
      type: String,
    },
    contactMethod: {
      type: String,
      enum: ["email", "phone", "other"],
      required: true,
    },
    contactDetails: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IFoundItem>("FoundItem", foundItemSchema);
