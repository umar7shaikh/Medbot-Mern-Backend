// src/services/groqService.js
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL =
  process.env.GROQ_MODEL || "meta-llama/llama-4-maverick-17b-128e-instruct";

const baseSystemPrompt = `
You are a cautious multilingual medical assistant.
You provide general health information only, not a diagnosis.
Always recommend consulting a qualified healthcare professional.
`;

export const generateTextReply = async ({ message, language, user }) => {
  const systemPrompt =
    baseSystemPrompt +
    `\nUser preferred language: ${language || user?.preferredLanguage || "en"}.`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    temperature: 0.3,
    max_completion_tokens: 512,
  });

  return (
    completion.choices?.[0]?.message?.content?.trim() ||
    "Sorry, no reply."
  );
};

export const generateVisionReply = async ({
  message,
  imageBase64,
  mimeType = "image/jpeg",
  language,
  user,
}) => {
  const systemPrompt =
    baseSystemPrompt +
    `\nYou can also analyze medical images.\nUser preferred language: ${
      language || user?.preferredLanguage || "en"
    }.`;

  const userPrompt =
    message && message.trim().length > 0
      ? message
      : "Describe the medically relevant details of this image.";

  // data URL that Groq vision accepts for local/base64 images [web:203]
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_completion_tokens: 512,
  });

  return (
    completion.choices?.[0]?.message?.content?.trim() ||
    "Sorry, no reply."
  );
};
