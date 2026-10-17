import QRCode from 'qrcode';
import jsQR from 'jsqr';

/**
 * Generates a Data URL image for a given QR string using BreakTym's Midnight Neomorphism palette.
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 320,
    margin: 2,
    color: {
      dark: '#B45CFF', // BreakTym neon purple
      light: '#17171C', // Dark midnight base
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Builds the official, safe BreakTym invitation URL for a personal QR code.
 */
export function generateProfileQRUrl(qrToken: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://breaktym.app';
  return `${origin}/?add=${encodeURIComponent(qrToken.trim())}`;
}

/**
 * Safely parses and validates a scanned QR code text or URL.
 * Prevents arbitrary external redirects by strictly extracting only the opaque BreakTym add token.
 */
export function parseQRUrl(scannedText: string): { isValid: boolean; qrToken?: string; error?: string } {
  if (!scannedText || typeof scannedText !== 'string') {
    return { isValid: false, error: 'Empty or unreadable QR code.' };
  }

  const trimmed = scannedText.trim();

  // 1. Check if it's a URL
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      // Query param `add` or `qr`
      const addParam = url.searchParams.get('add') || url.searchParams.get('qr');
      if (addParam && isValidTokenFormat(addParam)) {
        return { isValid: true, qrToken: addParam };
      }

      // Path format: /add/<token>
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2 && pathParts[0] === 'add' && isValidTokenFormat(pathParts[1])) {
        return { isValid: true, qrToken: pathParts[1] };
      }
    }
  } catch {
    // If not a valid URL, continue to direct token evaluation
  }

  // 2. Direct token string
  if (isValidTokenFormat(trimmed)) {
    return { isValid: true, qrToken: trimmed };
  }

  return { isValid: false, error: 'This QR code is not a valid BreakTym friend invitation.' };
}

/**
 * Helper to ensure the token has a safe format (alphanumeric, dashes, underscores, 8-64 chars)
 */
function isValidTokenFormat(token: string): boolean {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(token);
}

/**
 * Decodes a QR code from a locally chosen image file using an HTML5 Canvas and jsQR.
 * Does not transmit or store the user's image file.
 */
export async function decodeQRFromImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            resolve(code.data);
          } else {
            // Try inverted in case of dark QR on light background
            const invertedCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
            resolve(invertedCode?.data || null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Validates a BreakTym username according to documented rules:
 * - 3 to 20 characters
 * - Letters, numbers, and underscores only
 * - No spaces, no symbols
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const clean = username.trim();

  if (!clean) {
    return { valid: false, error: 'Username cannot be empty.' };
  }

  if (clean.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long.' };
  }

  if (clean.length > 20) {
    return { valid: false, error: 'Username cannot exceed 20 characters.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores (no spaces).' };
  }

  return { valid: true };
}

/**
 * Generates alternative username suggestions if a username is already taken.
 */
export function suggestUsernames(base: string): string[] {
  const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 14);
  if (!clean) return ['break_tym', 'night_owl', 'spontaneous_user'];

  const rand = Math.floor(Math.random() * 89 + 10);
  return [
    `${clean}_bt`,
    `${clean}_${rand}`,
    `${clean}x`,
  ];
}
