import mongoose, { Schema, Document } from "mongoose";

export interface IFlashcard extends Document {
  documentId: string;
  userId: string;
  cards: {
    front: string;
    back: string;
    mastered: boolean;
  }[];
}

const flashcardSchema = new Schema<IFlashcard>(
  {
    documentId: { type: String, required: true },
    userId: { type: String, required: true },
    cards: [
      {
        front: String,
        back: String,
        mastered: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IFlashcard>("Flashcard", flashcardSchema);