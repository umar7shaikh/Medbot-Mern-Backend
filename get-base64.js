// get-base64.mjs
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('❌ Usage: node get-base64.mjs your-image.jpg');
  process.exit(1);
}

const fullPath = join(__dirname, imagePath);
const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

try {
  const imageBuffer = await import('fs/promises').then(fs => fs.readFile(fullPath));
  const base64 = imageBuffer.toString('base64');
  
  console.log('📋 Copy this JSON into Postman:');
  console.log(`{
  "imageBase64": "${base64}",
  "mimeType": "${mimeType}",
  "message": "Describe the medically relevant details of this image.",
  "language": "en"
}`);
} catch (error) {
  console.error('❌ Image not found:', fullPath);
}
