import mime from 'mime-types';

// Custom mappings for extensions not covered by mime-types library
const customMimeTypes: Record<string, string> = {
  'py': 'text/x-python',
  'tsx': 'text/typescript-jsx',
  'ts': 'text/typescript',
  'jsx': 'text/javascript-jsx',
};

/**
 * Improved MIME type detection that uses file extension as fallback
 * when browser-provided MIME type is generic or unreliable.
 * 
 * @param browserMimeType - MIME type provided by the browser/multer
 * @param filename - The filename to extract extension from
 * @returns The best-guess MIME type
 */
export function detectMimeType(browserMimeType: string, filename: string): string {
  // If browser provided a specific, reliable MIME type, use it
  if (browserMimeType && 
      browserMimeType !== 'application/octet-stream' && 
      browserMimeType !== 'application/octet' &&
      !browserMimeType.startsWith('application/x-')) {
    return browserMimeType;
  }
  
  // Extract extension from filename
  const extension = filename.toLowerCase().split('.').pop();
  
  // Check our custom mappings first
  if (extension && customMimeTypes[extension]) {
    return customMimeTypes[extension];
  }
  
  // Fallback to mime-types library
  const extensionBasedMimeType = mime.lookup(filename);
  
  if (extensionBasedMimeType) {
    return extensionBasedMimeType;
  }
  
  // Final fallback to browser MIME type (even if generic)
  return browserMimeType || 'application/octet-stream';
}