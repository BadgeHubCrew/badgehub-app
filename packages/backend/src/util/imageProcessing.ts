import sharp from "sharp";
import { UploadedFile } from "@shared/domain/UploadedFile";

export async function getImageProps(typedFile: UploadedFile) {
  let image_width: number | undefined;
  let image_height: number | undefined;

  // Check if the uploaded file is an image and get its dimensions 🖼️
  if (typedFile.mimetype.startsWith("image/")) {
    try {
      const metadata = await sharp(typedFile.fileContent).metadata();
      image_width = metadata.width;
      image_height = metadata.height;
    } catch (e) {
      console.error("Sharp failed to read image metadata", e);
      // Fail gracefully if metadata cannot be read
    }
  }
  return {
    image_width,
    image_height,
  };
}

export async function createIconBuffer(
  fileContent: Uint8Array,
  size = 64
): Promise<Buffer> {
  return sharp(fileContent)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}
