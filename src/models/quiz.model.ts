import mongoose, { Schema, Document } from "mongoose";

export interface IQuiz extends Document {
  documentId: string;
  userId: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

const quizSchema = new Schema<IQuiz>(
  {
    documentId: { type: String, required: true },
    userId: { type: String, required: true },
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
      },
    ],
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IQuiz>("Quiz", quizSchema);