export type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'rejected' | 'declined' | 'cancelled' | 'expired';
export type MeetingStatus = 'pending' | 'completed' | 'cancelled' | 'missed';

export interface ActivityInvitation {
  id: string;
  senderId: string;
  recipientId: string;
  activityId: string;
  activityTitle: string;
  customNote?: string;
  status: InvitationStatus;
  meetingStatus?: MeetingStatus;
  createdAt: string;
  updatedAt?: string;
  acceptedAt?: string;
  expiresAt?: string;
  headline?: string;
  senderCelebratedAt?: string;
  recipientCelebratedAt?: string;
  // Enriched profile fields for Inbox and Recipient UI
  senderDisplayName?: string;
  senderUsername?: string | null;
  senderAvatarUrl?: string;
  recipientDisplayName?: string;
  recipientUsername?: string | null;
  recipientAvatarUrl?: string;
}

export interface InvitationResult {
  success: boolean;
  invitationId?: string;
  contactId: string;
  activityId: string;
  activityTitle: string;
  message: string;
  isLiveBackendDelivery: boolean;
  errorMessage?: string;
  recipientName?: string;
  personalStreak?: number;
  friendshipStreak?: number;
}

export interface InvitationStreaks {
  personalStreak: number;
  friendshipStreak: number;
}

export const CELEBRATION_HEADLINES = [
  "IT'S A PLAN! 🔥",
  "THE VIBE IS CONFIRMED! 💜",
  "PLOT TWIST: THEY SAID YES! 👀",
  "THAT'S A YES. 💌",
  "A MOMENT IN THE MAKING ✨",
] as const;

/**
 * Deterministically maps an invitation ID to one of the 5 canonical celebration headlines.
 * Guarantees that both sender and recipient see the exact same headline for any invitation.
 */
export function getCelebrationHeadline(invitationId: string, customHeadline?: string | null): string {
  if (customHeadline && customHeadline.trim()) {
    return customHeadline;
  }
  let hash = 0;
  for (let i = 0; i < invitationId.length; i++) {
    hash = (hash << 5) - hash + invitationId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CELEBRATION_HEADLINES.length;
  return CELEBRATION_HEADLINES[index];
}
