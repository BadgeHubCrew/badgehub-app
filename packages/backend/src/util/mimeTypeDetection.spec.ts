import { describe, expect, it } from 'vitest';
import { detectMimeType } from './mimeTypeDetection.ts';

describe('MIME Type Detection', () => {
  it('should use browser MIME type when it is specific and reliable', () => {
    expect(detectMimeType('text/x-python', 'test.py')).toBe('text/x-python');
    expect(detectMimeType('application/json', 'config.json')).toBe('application/json');
    expect(detectMimeType('image/png', 'icon.png')).toBe('image/png');
  });

  it('should fallback to extension-based detection for generic browser MIME types', () => {
    expect(detectMimeType('application/octet-stream', 'script.py')).toBe('text/x-python');
    expect(detectMimeType('application/octet', 'data.json')).toBe('application/json');
    expect(detectMimeType('application/x-unknown', 'style.css')).toBe('text/css');
  });

  it('should handle various file extensions correctly', () => {
    expect(detectMimeType('application/octet-stream', 'app.js')).toBe('application/javascript');
    expect(detectMimeType('application/octet-stream', 'component.tsx')).toBe('text/typescript-jsx');
    expect(detectMimeType('application/octet-stream', 'readme.md')).toBe('text/markdown');
    expect(detectMimeType('application/octet-stream', 'config.yml')).toBe('text/yaml');
  });

  it('should return browser MIME type as final fallback for unknown extensions', () => {
    expect(detectMimeType('application/octet-stream', 'file.unknown')).toBe('application/octet-stream');
    expect(detectMimeType('application/custom', 'file.unknown')).toBe('application/custom');
  });

  it('should handle empty or missing browser MIME type', () => {
    expect(detectMimeType('', 'test.py')).toBe('text/x-python');
    expect(detectMimeType('', 'file.unknown')).toBe('application/octet-stream');
  });

  it('should handle files without extensions', () => {
    expect(detectMimeType('text/plain', 'README')).toBe('text/plain');
    expect(detectMimeType('application/octet-stream', 'Dockerfile')).toBe('application/octet-stream');
  });
});