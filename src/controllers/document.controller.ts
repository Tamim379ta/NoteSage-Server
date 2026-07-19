import { Request, Response } from "express";
import { PdfReader } from "pdfreader";
import DocumentModel from "../models/document.model";
import QuizModel from "../models/quiz.model";
import FlashcardModel from "../models/flashcard.model";
import { groq } from "../config/groq";

// PDF text extraction
function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new PdfReader();
    let text = "";

    reader.parseBuffer(buffer, (err: any, item: any) => {
      if (err) {
        reject(err);
      } else if (!item) {
        resolve(text);
      } else if (item.text) {
        text += item.text + " ";
      }
    });
  });
}

// AI helpers
async function generateSummary(text: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are a study assistant. Summarize the following study material into 5-7 clear bullet points. Focus on the most important concepts a student must remember. Keep each point concise and specific.

Material:
${text.slice(0, 8000)}

Return only the bullet points, no preamble.`,
      },
    ],
  });

  return response.choices[0]?.message?.content || "";
}

async function generateQuiz(text: string): Promise<any[]> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a study assistant. Generate 10 multiple choice quiz questions based on the following study material.

Material:
${text.slice(0, 8000)}

Return ONLY a valid JSON array with this exact structure, no preamble, no markdown:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation of why this is correct"
  }
]`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "[]";
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function generateFlashcards(text: string): Promise<any[]> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a study assistant. Generate 15 flashcards based on the following study material.

Material:
${text.slice(0, 8000)}

Return ONLY a valid JSON array with this exact structure, no preamble, no markdown:
[
  {
    "front": "Question or concept on the front of the card",
    "back": "Answer or explanation on the back of the card"
  }
]`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "[]";
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// POST /api/documents/upload
export async function uploadDocument(req: Request, res: Response) {
  try {
    const file = req.file;
    const userId = (req as any).userId;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const title =
      (req.body.title as string) ||
      file.originalname.replace(/\.[^/.]+$/, "");

    const doc = await DocumentModel.create({
      userId,
      title,
      fileType: file.mimetype,
      status: "processing",
    });

    // Respond immediately — don't make client wait for AI processing
    res.status(201).json({
      message: "Document uploaded, processing started.",
      documentId: doc._id,
    });

    // Process in background
    try {
      const extractedText =
        file.mimetype === "application/pdf"
          ? await extractTextFromPDF(file.buffer)
          : file.buffer.toString("utf-8");

      const [summary, quizQuestions, flashcardItems] = await Promise.all([
        generateSummary(extractedText),
        generateQuiz(extractedText),
        generateFlashcards(extractedText),
      ]);

      await DocumentModel.findByIdAndUpdate(doc._id, {
        extractedText,
        summary,
        status: "ready",
      });

      await QuizModel.create({
        documentId: doc._id.toString(),
        userId,
        questions: quizQuestions,
        difficulty: "Intermediate",
      });

      await FlashcardModel.create({
        documentId: doc._id.toString(),
        userId,
        cards: flashcardItems.map((f: any) => ({ ...f, mastered: false })),
      });

      console.log(`✅ Document ${doc._id} processed successfully`);
    } catch (processingError) {
      console.error("Processing error:", processingError);
      await DocumentModel.findByIdAndUpdate(doc._id, { status: "failed" });
    }
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message });
  }
}
export async function getStats(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    const [documents, quizzes, flashcardSets] = await Promise.all([
      DocumentModel.find({ userId }).sort({ createdAt: -1 }),
      QuizModel.find({ userId }),
      FlashcardModel.find({ userId }),
    ]);

    const totalFlashcards = flashcardSets.reduce(
      (acc, f) => acc + f.cards.length, 0
    );
    const totalQuizzes = quizzes.length;
    const totalDocuments = documents.length;

    // Documents per month for line chart
    const monthlyMap: Record<string, number> = {};
    documents.forEach((doc) => {
      const month = new Date(doc.createdAt).toLocaleString("en-US", { month: "short" });
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let cumulative = 0;
    const documentsOverTime = months
      .filter((m) => monthlyMap[m])
      .map((month) => {
        cumulative += monthlyMap[month] || 0;
        return { month, documents: cumulative };
      });

    // Recent 5 documents
    const recentDocuments = documents.slice(0, 5);

    return res.json({
      totalDocuments,
      totalFlashcards,
      totalQuizzes,
      recentDocuments,
      documentsOverTime,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/documents
export async function getDocuments(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const documents = await DocumentModel.find({ userId }).sort({
      createdAt: -1,
    });
    return res.json(documents);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/documents/:id
export async function getDocument(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const doc = await DocumentModel.findOne({ _id: id, userId });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    const quiz = await QuizModel.findOne({ documentId: id, userId });
    const flashcards = await FlashcardModel.findOne({ documentId: id, userId });

    return res.json({ document: doc, quiz, flashcards });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /api/documents/:id
export async function deleteDocument(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await DocumentModel.findOneAndDelete({ _id: id, userId });
    await QuizModel.findOneAndDelete({ documentId: id, userId });
    await FlashcardModel.findOneAndDelete({ documentId: id, userId });

    return res.json({ message: "Document deleted." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}