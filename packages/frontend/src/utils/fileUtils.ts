/**
 * Extracts the filename from a full file path
 * @param filePath - The full file path (e.g., "folder/subfolder/file.txt")
 * @returns The filename (e.g., "file.txt") or the original path if no filename found
 */
export const extractFilename = (filePath: string): string => {
  return filePath.split("/").pop() || filePath;
};

/**
 * File extensions that should be treated as text files for preview purposes
 */
export const TEXT_FILE_EXTENSIONS = [
  "js", "jsx", "ts", "tsx", "html", "css", "scss", "sass", "less", 
  "xml", "yaml", "yml", "md", "sh", "bash", "c", "cpp", "java", 
  "php", "rb", "go", "rs", "sql", "txt"
] as const;

/**
 * File extensions that should be treated as image files for preview purposes
 */
export const IMAGE_FILE_EXTENSIONS = [
  "png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "tiff", "tif", "avif"
] as const;