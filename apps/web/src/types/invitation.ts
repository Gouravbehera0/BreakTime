export interface ActivityInvitation {
  id: string;
  senderId: string;
  recipientId: string;
  activityId: string;
  activityTitle: string;
  customNote?: string;
  status: 'sent' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
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
}
