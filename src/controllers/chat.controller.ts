import { Request, Response } from "express";
import ChatModel from "../models/chat.model";
import { groq } from "../config/groq";

const systemPrompt =
  "You are a study assistant. Help the user by answering questions clearly and concisely.";

export async function sendMessage(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { message, sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    let session = sessionId
      ? await ChatModel.findOne({ _id: sessionId, userId })
      : null;

    if (!session) {
      session = await ChatModel.create({
        userId,
        messages: [],
      });
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

    res.write(`data: ${JSON.stringify({ done: true, sessionId: session._id })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Chat controller error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error?.message || "Server error" });
    }
    res.write(`data: ${JSON.stringify({ error: error?.message || "Server error" })}\n\n`);
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

    const session = await ChatModel.findOne({ _id: id, userId });
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

    await ChatModel.findOneAndDelete({ _id: id, userId });
    return res.json({ message: "Session deleted." });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}
