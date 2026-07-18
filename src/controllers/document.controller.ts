import { groq } from "../config/groq";

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