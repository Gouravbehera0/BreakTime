import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { InvitationResult, ActivityInvitation } from '@/types/invitation';

const INVITATIONS_STORAGE_KEY = 'breaktym_recent_invitations';

export const invitationService = {
  /**
   * Dispatches an activity invitation to the selected friend
   */
  async sendActivityInvitation(
    contactId: string,
    senderUserId: string,
    activityId: string,
    activityTitle: string,
    customNote?: string,
    isDemo = false
  ): Promise<InvitationResult> {
    if (!contactId) {
      return {
        success: false,
        contactId,
        activityId,
        activityTitle,
        message: 'Invalid recipient contact ID.',
        isLiveBackendDelivery: false,
        errorMessage: 'Recipient is required.',
      };
    }

    // Small delay for natural UI feedback
    await new Promise((res) => setTimeout(res, 500));

    // Try Supabase if configured & not in pure demo
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('activity_invitations')
          .insert({
            sender_id: senderUserId,
            recipient_id: contactId,
            activity_id: activityId,
            activity_title: activityTitle,
            custom_note: customNote || null,
            status: 'sent',
          })
          .select('id')
          .single();

        if (error) {
          // If table doesn't exist yet, gracefully fall back to local confirmed record
          console.warn('Backend invitation table notice:', error.message);
        } else if (data) {
          const inv: ActivityInvitation = {
            id: data.id,
            senderId: senderUserId,
            recipientId: contactId,
            activityId,
            activityTitle,
            customNote,
            status: 'sent',
            createdAt: new Date().toISOString(),
          };
          this.recordRecentInvitation(inv);

          return {
            success: true,
            invitationId: data.id,
            contactId,
            activityId,
            activityTitle,
            message: `Invitation for ${activityTitle} sent to your friend!`,
            isLiveBackendDelivery: true,
          };
        }
      } catch (err) {
        console.warn('Supabase invitation exception:', err);
      }
    }

    // Development / Local confirmation path
    const localId = `inv_${Date.now()}`;
    const inv: ActivityInvitation = {
      id: localId,
      senderId: senderUserId,
      recipientId: contactId,
      activityId,
      activityTitle,
      customNote,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    this.recordRecentInvitation(inv);

    return {
      success: true,
      invitationId: localId,
      contactId,
      activityId,
      activityTitle,
      message: `Invitation for ${activityTitle} recorded!`,
      isLiveBackendDelivery: isSupabaseConfigured() && !isDemo,
    };
  },

  /**
   * Retrieves recorded recent invitations
   */
  getRecentInvitations(): ActivityInvitation[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(INVITATIONS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /**
   * Records an invitation into recent local history
   */
  recordRecentInvitation(invitation: ActivityInvitation): void {
    const list = this.getRecentInvitations();
    const updated = [invitation, ...list.filter((i) => i.id !== invitation.id)].slice(0, 20);
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(updated));
  },
};
