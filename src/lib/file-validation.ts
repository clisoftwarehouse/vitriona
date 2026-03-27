/**
 * Validates file contents by checking magic bytes (file signatures).
 * This prevents MIME type spoofing where an attacker sends a malicious
 * file with a forged Content-Type header.
 */

const IMAGE_SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header; WebP also has WEBP at offset 8
  { mime: 'image/avif', bytes: [0x00, 0x00, 0x00] }, // ftyp box (variable offset, simplified)
];

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46]; // %PDF

function matchesSignature(buffer: Uint8Array, expected: number[]): boolean {
  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

export async function validateImageFile(file: File): Promise<boolean> {
  const buffer = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return IMAGE_SIGNATURES.some((sig) => matchesSignature(buffer, sig.bytes));
}

export async function validatePdfFile(file: File): Promise<boolean> {
  const buffer = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return matchesSignature(buffer, PDF_SIGNATURE);
}

/**
 * Sanitize a filename to prevent path traversal and other injection attacks.
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 200);
}
