import { Schema, model, Document, Types } from "mongoose";

export interface IItemAnswer extends Document {
  itemId: Types.ObjectId;
  answers: string[];
  answeredBy?: Types.ObjectId;
  meta?: { ip?: string; ua?: string };
  createdAt: Date;
  updatedAt: Date;
}

const itemAnswerSchema = new Schema<IItemAnswer>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "FoundItem",
      required: true,
      index: true,
    },
    answers: {
      type: [String],
      required: true,
      validate: [
        (v: string[]) =>
          v.length > 0 && v.every((s) => String(s).trim().length > 0),
        "At least one non-empty answer",
      ],
    },
    answeredBy: { type: Schema.Types.ObjectId, ref: "User" },
    meta: { ip: String, ua: String },
  },
  { timestamps: true }
);

itemAnswerSchema.index({ itemId: 1, createdAt: -1 });

export default model<IItemAnswer>("ItemAnswer", itemAnswerSchema);
