import { ContactPerson } from '@/types/contact';

// Type definitions for the experimental Contact Picker API
interface ContactProperty {
  name?: string[];
  tel?: string[];
}

interface ContactsManager {
  getProperties(): Promise<string[]>;
  select(
    properties: string[],
    options?: { multiple?: boolean }
  ): Promise<ContactProperty[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

/**
 * Checks if the browser natively supports the Contact Picker API.
 * Currently supported primarily on Chrome/Chromium Android and select mobile browsers.
 */
export function isContactPickerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && typeof navigator.contacts?.select === 'function';
}

/**
 * Normalizes phone numbers to standard E.164 digits format (e.g. +919876543210 or 9876543210).
 */
export function normalizePhoneNumber(raw: string, defaultCountryCode = '+91'): string {
  if (!raw) return '';
  // Remove spaces, hyphens, brackets, dots
  let cleaned = raw.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  } else if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      cleaned = defaultCountryCode + cleaned.slice(1);
    } else if (cleaned.length === 10) {
      cleaned = defaultCountryCode + cleaned;
    }
  }

  return cleaned;
}

/**
 * Launches the native browser contact picker if available.
 */
export async function pickPhoneContacts(): Promise<{
  supported: boolean;
  contacts: ContactPerson[];
  error?: string;
}> {
  if (!isContactPickerSupported() || !navigator.contacts) {
    return {
      supported: false,
      contacts: [],
      error: 'Contact Picker API is not supported in this browser.',
    };
  }

  try {
    const props = ['name', 'tel'];
    const selected = await navigator.contacts.select(props, { multiple: true });

    if (!selected || selected.length === 0) {
      return {
        supported: true,
        contacts: [],
      };
    }

    const result: ContactPerson[] = selected.map((item, index) => {
      const displayName = item.name && item.name.length > 0 ? item.name[0] : 'Unknown Contact';
      const phoneNumbers = (item.tel || []).map((t) => normalizePhoneNumber(t)).filter(Boolean);

      return {
        id: `phone_contact_${Date.now()}_${index}`,
        displayName,
        phoneNumbers,
      };
    }).filter((c) => c.phoneNumbers.length > 0);

    return {
      supported: true,
      contacts: result,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      supported: true,
      contacts: [],
      error: errorMsg,
    };
  }
}

/**
 * Generates an invitation link for BreakTym.
 */
export function generateInviteLink(userName?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://breaktym.app';
  const nameParam = userName ? `?inviter=${encodeURIComponent(userName)}` : '';
  return `${origin}/${nameParam}`;
}
