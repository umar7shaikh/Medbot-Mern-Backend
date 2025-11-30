// src/services/elevenTtsService.js
import fetch from "node-fetch"; // Node 18+ can use global fetch

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_ID = process.env.ELEVEN_VOICE_ID || "your-voice-id-here";

// Simple mapping: pick same voice for now; model is multilingual
export async function elevenTextToSpeechBuffer(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2", // multilingual TTS model
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${errText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer); // MP3 buffer
}
