import { Schema, model, Document } from "mongoose";

export type ClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "archived"
  | "completed";

export interface IClaim extends Document {
  itemId: Schema.Types.ObjectId;
  ownerId: Schema.Types.ObjectId;
  responderId: Schema.Types.ObjectId;
  answers: [string, string];
  message?: string;
  status: ClaimStatus;
  createdAt: Date;
  updatedAt: Date;
}

const claimSchema = new Schema<IClaim>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "FoundItem", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    responderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length === 2, "Two answers"],
    },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "archived", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default model<IClaim>("Claim", claimSchema);
