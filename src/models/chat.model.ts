import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
  userId: string;
  documentId?: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }[];
}

const chatSchema = new Schema<IChat>(
  {
    userId: { type: String, required: true },
    documentId: { type: String, default: null },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IChat>("Chat", chatSchema);