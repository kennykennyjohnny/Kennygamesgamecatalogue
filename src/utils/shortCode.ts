import { nanoid } from 'nanoid';

/**
 * Generate a short, URL-friendly game code
 * Format: 6 characters, alphanumeric (avoiding confusing chars like 0/O, 1/l)
 */
export function generateShortCode(): string {
  // Use nanoid with custom alphabet (no confusing characters)
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  return nanoid(6).split('').map(c => {
    const index = c.charCodeAt(0) % alphabet.length;
    return alphabet[index];
  }).join('');
}

/**
 * Validate a short code format
 */
export function isValidShortCode(code: string): boolean {
  return /^[a-zA-Z0-9]{6}$/.test(code);
}

/**
 * Generate shareable game URL
 */
export function getGameUrl(shortCode: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/g/${shortCode}`;
}
