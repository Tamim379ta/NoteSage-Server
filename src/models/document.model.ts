import mongoose, { Schema, Document as MongoDoc } from "mongoose";

export interface IDocument extends MongoDoc {
  userId: string;
  title: string;
  fileType: string;
  extractedText: string;
  summary: string;
  status: "processing" | "ready" | "failed";
  createdAt: Date;
  isPublic: boolean;
  category: string;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    title: { type: String, required: true },
    fileType: { type: String, required: true },
    extractedText: { type: String, default: "" },
    summary: { type: String, default: "" },
    status: { type: String, enum: ["processing", "ready", "failed"], default: "processing" },
    category: { type: String, default: "General" },
  },
  { timestamps: true }
);

export default mongoose.model<IDocument>("Document", documentSchema);