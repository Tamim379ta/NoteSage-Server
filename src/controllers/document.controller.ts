import { Request, Response } from "express";
import { PdfReader } from "pdfreader";
import DocumentModel from "../models/document.model";
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

// AI summary
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
    const category = req.body.category || "General";
    const isPublic = req.body.isPublic === "true" || true;

    const doc = await DocumentModel.create({
      userId,
      title,
      category,
      fileType: file.mimetype,
      status: "processing",
      isPublic,
    });

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

      const summary = await generateSummary(extractedText);

      await DocumentModel.findByIdAndUpdate(doc._id, {
        extractedText,
        summary,
        status: "ready",
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

// GET /api/documents/public
export async function getPublicDocuments(req: Request, res: Response) {
  try {
    const { search, category, sort } = req.query;

    const query: any = {
      status: "ready",
      $or: [{ isPublic: true }, { isPublic: { $exists: false } }],
    };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (category && category !== "All") {
      query.category = category;
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const documents = await DocumentModel.find(query)
      .sort(sortOption)
      .select("-extractedText");

    return res.json(documents);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/documents/public/:id
export async function getPublicDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const doc = await DocumentModel.findOne({
      _id: id,
      status: "ready",
      isPublic: true,
    }).select("-extractedText");

    if (!doc) return res.status(404).json({ error: "Not found." });
    return res.json(doc);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/documents/stats
export async function getStats(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    const documents = await DocumentModel.find({ userId }).sort({ createdAt: -1 });
    const totalDocuments = documents.length;

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

    const recentDocuments = documents.slice(0, 5);

    return res.json({
      totalDocuments,
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
    const documents = await DocumentModel.find({ userId }).sort({ createdAt: -1 });
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

    return res.json({ document: doc });
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
    return res.json({ message: "Document deleted." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}