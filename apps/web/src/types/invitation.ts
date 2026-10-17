export type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export interface ActivityInvitation {
  id: string;
  senderId: string;
  recipientId: string;
  activityId: string;
  activityTitle: string;
  customNote?: string;
  status: InvitationStatus;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
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
}
