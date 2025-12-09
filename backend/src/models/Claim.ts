import { Schema, model, Document, Types } from "mongoose";

export type ClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "archived"
  | "completed";

interface IClaim extends Document {
  itemId: Types.ObjectId;
  ownerId: Types.ObjectId;
  responderId: Types.ObjectId;
  answers: [string, string];
  message?: string;
  status: ClaimStatus;
  ownerUnread: boolean;
  responderUnread: boolean;
}

const claimSchema = new Schema<IClaim>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "FoundItem", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    responderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length === 2, "Exactly two answers"],
    },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "archived", "completed"],
      default: "pending",
    },
    ownerUnread: { type: Boolean, default: true },
    responderUnread: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<IClaim>("Claim", claimSchema);
