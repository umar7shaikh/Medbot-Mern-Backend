// src/services/groqAudioService.js
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeAudioFile(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const fileName = path.basename(filePath) || "audio.webm";

  const result = await groq.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-large-v3",
    response_format: "json",
    temperature: 0,
    // some SDK versions accept filename; if allowed, uncomment:
    // filename: fileName,
  });

  return result.text;
}

export async function textToSpeechBuffer(text) {
  const wav = await groq.audio.speech.create({
    model: "playai-tts",
    voice: "Aaliyah-PlayAI",
    response_format: "wav",
    input: text,
  });

  const buffer = Buffer.from(await wav.arrayBuffer());
  return buffer;
}
