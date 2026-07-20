import { Request, Response } from "express";
import ChatModel from "../models/chat.model";
import DocumentModel from "../models/document.model";
import { groq } from "../config/groq";

export async function sendMessage(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { message, sessionId, documentId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    // Cast sessionId to string to satisfy Mongoose's strict query types
    let session = sessionId
      ? await ChatModel.findOne({ _id: sessionId as string, userId })
      : null;

    if (!session) {
      session = await ChatModel.create({
        userId,
        messages: [],
      });
    }

    // Build dynamic system prompt
    let systemPrompt =
      "You are NoteSage, a friendly AI study tutor. Help the student understand their study material clearly and concisely. When explaining concepts, use simple language and examples.";

    if (documentId) {
      const doc = await DocumentModel.findOne({
        _id: documentId as string,
        status: "ready",
      });
      if (doc && doc.extractedText) {
        systemPrompt += `\n\nThe student is asking about the following study material. Use it as your PRIMARY reference and always ground your answers in it:\n\n--- STUDY MATERIAL START ---\n${doc.extractedText.slice(0, 12000)}\n--- STUDY MATERIAL END ---\n\nIf asked something unrelated to this material, still answer helpfully but note it's outside the uploaded content.`;
      }
    }

    const history = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let assistantText = "";

    for await (const chunk of stream as AsyncIterable<any>) {
      const text = chunk.choices?.[0]?.delta?.content || "";
      if (text) {
        assistantText += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });
    session.messages.push({
      role: "assistant",
      content: assistantText,
      timestamp: new Date(),
    });

    await session.save();

    res.write(
      `data: ${JSON.stringify({ done: true, sessionId: session._id })}\n\n`
    );
    res.end();
  } catch (error: any) {
    console.error("Chat controller error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error?.message || "Server error" });
    }
    res.write(
      `data: ${JSON.stringify({ error: error?.message || "Server error" })}\n\n`
    );
    res.end();
  }
}

export async function getSessions(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessions = await ChatModel.find({ userId }).sort({ updatedAt: -1 });
    return res.json(sessions);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const session = await ChatModel.findOne({ _id: id as string, userId });
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    return res.json(session);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}

export async function deleteSession(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await ChatModel.findOneAndDelete({ _id: id as string, userId });
    return res.json({ message: "Session deleted." });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}