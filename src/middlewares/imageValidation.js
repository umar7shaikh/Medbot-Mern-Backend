// src/middlewares/imageValidation.js
import imageSize from 'image-size';

export const validateImage = async (req, res, next) => {
  try {
    const { imageBase64, mimeType } = req.body;

    console.log('validateImage hit. base64 length:', imageBase64?.length || 0, 'mimeType:', mimeType);

    if (!imageBase64) {
      return res.status(400).json({ message: "imageBase64 is required" });
    }

    if (imageBase64.length > 13_312_500) {
      return res.status(400).json({ message: "Image too large (max 10MB)" });
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (mimeType && !validMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        message: `Unsupported format. Use: ${validMimeTypes.join(', ')}`
      });
    }

    try {
      const buffer = Buffer.from(imageBase64.substring(0, 100), 'base64');
      const size = imageSize(buffer);

      if (!size || !['jpeg', 'png', 'webp'].includes(size.type)) {
        return res.status(400).json({ message: "Invalid image format" });
      }

      req.imageInfo = {
        type: size.type,
        dimensions: `${size.width}x${size.height}`,
        mimeType: `image/${size.type}`
      };
    } catch (err) {
      return res.status(400).json({ message: "Invalid base64 image data" });
    }

    next();
  } catch (err) {
    console.error('Image validation error:', err.message);
    return res.status(500).json({ message: "Validation error" });
  }
};
