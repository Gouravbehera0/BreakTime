import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  InvitationResult,
  ActivityInvitation,
  InvitationStatus,
  MeetingStatus,
  InvitationStreaks,
  getCelebrationHeadline,
} from '@/types/invitation';

const INVITATIONS_STORAGE_KEY = 'breaktym_recent_invitations';
const DEMO_INVITATIONS_KEY = 'breaktym_demo_invitations';

export interface RespondInvitationResult {
  success: boolean;
  message?: string;
  error?: string;
  invitationId?: string;
  status?: 'accepted' | 'rejected' | 'declined';
  meetingStatus?: MeetingStatus;
  headline?: string;
  senderId?: string;
  recipientId?: string;
  senderName?: string;
  recipientName?: string;
  personalStreak?: number;
  friendshipStreak?: number;
  invitation?: ActivityInvitation;
}

// Initial demo invitations for seamless offline/demo testing
const INITIAL_DEMO_INVITATIONS: ActivityInvitation[] = [
  {
    id: 'demo_inv_1',
    senderId: 'friend_aisha',
    recipientId: 'demo_current_user',
    activityId: 'act_chai',
    activityTitle: 'Evening Chai',
    customNote: 'Warm cups and slow talks. Tapri chai today?',
    status: 'pending',
    meetingStatus: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    senderDisplayName: 'Aisha Sen',
    senderUsername: 'aisha',
    senderAvatarUrl: undefined,
  },
  {
    id: 'demo_inv_prev_accepted',
    senderId: 'demo_current_user',
    recipientId: 'friend_aisha',
    activityId: 'act_night_ride',
    activityTitle: 'Night Ride',
    status: 'accepted',
    meetingStatus: 'pending',
    headline: "IT'S A PLAN! 🔥",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    acceptedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    senderCelebratedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    recipientCelebratedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    recipientDisplayName: 'Aisha Sen',
    recipientUsername: 'aisha',
  },
];

export const invitationService = {
  /**
   * Dispatches an activity invitation to the selected friend.
   * Real Supabase backend delivery is verified before claiming success.
   */
  async sendActivityInvitation(
    contactId: string,
    senderUserId: string,
    activityId: string,
    activityTitle: string,
    customNote?: string,
    isDemo = false
  ): Promise<InvitationResult> {
    if (!contactId || !contactId.trim()) {
      return {
        success: false,
        contactId,
        activityId,
        activityTitle,
        message: 'Recipient contact is required.',
        isLiveBackendDelivery: false,
        errorMessage: 'Recipient contact is required.',
      };
    }

    if (!senderUserId || !senderUserId.trim()) {
      return {
        success: false,
        contactId,
        activityId,
        activityTitle,
        message: 'Authentication required. Please sign in.',
        isLiveBackendDelivery: false,
        errorMessage: 'Authentication required. Please sign in.',
      };
    }

    if (contactId === senderUserId) {
      return {
        success: false,
        contactId,
        activityId,
        activityTitle,
        message: 'You cannot send an invitation to yourself.',
        isLiveBackendDelivery: false,
        errorMessage: 'You cannot send an invitation to yourself.',
      };
    }

    // Try live Supabase delivery when configured & not in pure demo
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        console.log('[BreakTym Invitation] Sending invitation to Supabase...', {
          senderUserId,
          contactId,
          activityId,
          activityTitle,
        });

        // 1. Try secure atomic RPC: create_activity_invitation
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('create_activity_invitation', {
          target_recipient_id: contactId,
          input_activity_id: activityId,
          input_activity_title: activityTitle,
          input_custom_note: customNote ? customNote.trim() : null,
        });

        if (!rpcError && rpcData) {
          const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
          if (res.success) {
            const newInv: ActivityInvitation = {
              id: res.invitation_id,
              senderId: senderUserId,
              recipientId: contactId,
              activityId,
              activityTitle,
              customNote: customNote ? customNote.trim() : undefined,
              status: 'pending',
              meetingStatus: 'pending',
              createdAt: new Date().toISOString(),
              recipientDisplayName: res.recipient_name,
            };
            this.recordRecentInvitation(newInv);

            return {
              success: true,
              invitationId: res.invitation_id,
              contactId,
              activityId,
              activityTitle,
              message: res.message || `Invitation for ${activityTitle} sent to your friend! ✨`,
              isLiveBackendDelivery: true,
              recipientName: res.recipient_name,
            };
          } else {
            console.warn('[BreakTym Invitation] RPC returned application error:', res.error);
            return {
              success: false,
              contactId,
              activityId,
              activityTitle,
              message: res.error || 'Failed to dispatch invitation.',
              errorMessage: res.error,
              isLiveBackendDelivery: false,
            };
          }
        }

        // 2. Direct table insert fallback (if RPC is not yet created or failed)
        console.warn('[BreakTym Invitation] RPC not available or failed, using table insert fallback:', rpcError?.message);
        const { data, error: insertError } = await supabase
          .from('activity_invitations')
          .insert({
            sender_id: senderUserId,
            recipient_id: contactId,
            activity_id: activityId,
            activity_title: activityTitle,
            custom_note: customNote ? customNote.trim() : null,
            status: 'pending',
            meeting_status: 'pending',
          })
          .select('id, created_at')
          .single();

        if (insertError) {
          console.error('[BreakTym Invitation] Database insert failed:', insertError);
          return {
            success: false,
            contactId,
            activityId,
            activityTitle,
            message: `Failed to deliver invitation: ${insertError.message}`,
            errorMessage: insertError.message,
            isLiveBackendDelivery: false,
          };
        }

        if (data && data.id) {
          const inv: ActivityInvitation = {
            id: data.id,
            senderId: senderUserId,
            recipientId: contactId,
            activityId,
            activityTitle,
            customNote: customNote ? customNote.trim() : undefined,
            status: 'pending',
            meetingStatus: 'pending',
            createdAt: data.created_at || new Date().toISOString(),
          };
          this.recordRecentInvitation(inv);

          return {
            success: true,
            invitationId: data.id,
            contactId,
            activityId,
            activityTitle,
            message: `Invitation for ${activityTitle} sent to your friend! ✨`,
            isLiveBackendDelivery: true,
          };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[BreakTym Invitation] Exception dispatching invitation:', err);
        return {
          success: false,
          contactId,
          activityId,
          activityTitle,
          message: `Network or server error: ${errorMsg}`,
          errorMessage: errorMsg,
          isLiveBackendDelivery: false,
        };
      }
    }

    // Demo Mode Confirmation Path (only used when isDemo is explicitly true or Supabase is unconfigured)
    const localId = `demo_inv_${Date.now()}`;
    const inv: ActivityInvitation = {
      id: localId,
      senderId: senderUserId,
      recipientId: contactId,
      activityId,
      activityTitle,
      customNote: customNote ? customNote.trim() : undefined,
      status: 'pending',
      meetingStatus: 'pending',
      createdAt: new Date().toISOString(),
      senderDisplayName: 'You',
    };

    // Store in demo storage
    const existingDemo = this.getDemoInvitations();
    localStorage.setItem(DEMO_INVITATIONS_KEY, JSON.stringify([inv, ...existingDemo]));
    this.recordRecentInvitation(inv);

    return {
      success: true,
      invitationId: localId,
      contactId,
      activityId,
      activityTitle,
      message: `Invitation for ${activityTitle} sent! ✨ (Demo Lounge)`,
      isLiveBackendDelivery: false,
    };
  },

  /**
   * Retrieves activity invitations for a user (incoming received or sent).
   * Populates sender profile details (name, username, avatar) for recipient cards.
   */
  async getInvitations(
    userId: string,
    isDemo = false,
    filterMode: 'all' | 'received' | 'sent' | 'pending_received' = 'all'
  ): Promise<ActivityInvitation[]> {
    if (!userId) return [];

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        // 1. Try secure RPC: get_user_invitations
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_user_invitations', {
          filter_mode: filterMode,
        });

        if (!rpcError && Array.isArray(rpcData)) {
          return rpcData.map((d: any) => ({
            id: d.id,
            senderId: d.sender_id,
            recipientId: d.recipient_id,
            activityId: d.activity_id,
            activityTitle: d.activity_title,
            customNote: d.custom_note || undefined,
            status: d.status as InvitationStatus,
            meetingStatus: (d.meeting_status as MeetingStatus) || 'pending',
            headline: d.headline || undefined,
            acceptedAt: d.accepted_at || undefined,
            senderCelebratedAt: d.sender_celebrated_at || undefined,
            recipientCelebratedAt: d.recipient_celebrated_at || undefined,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            expiresAt: d.expires_at || undefined,
            senderDisplayName: d.sender_display_name,
            senderUsername: d.sender_username,
            senderAvatarUrl: d.sender_avatar_url || undefined,
            recipientDisplayName: d.recipient_display_name,
            recipientUsername: d.recipient_username,
            recipientAvatarUrl: d.recipient_avatar_url || undefined,
          }));
        }

        // 2. Direct table fallback with profile lookups
        let query = supabase.from('activity_invitations').select('*');

        if (filterMode === 'received') {
          query = query.eq('recipient_id', userId);
        } else if (filterMode === 'sent') {
          query = query.eq('sender_id', userId);
        } else if (filterMode === 'pending_received') {
          query = query.eq('recipient_id', userId).in('status', ['pending', 'sent']);
        } else {
          query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
        }

        const { data: rawInvitations, error: tableError } = await query.order('created_at', { ascending: false });

        if (tableError) {
          console.warn('[BreakTym Invitation] Querying activity_invitations notice:', tableError.message);
          return [];
        }

        if (!rawInvitations || rawInvitations.length === 0) {
          return [];
        }

        // Collect unique user IDs to fetch profiles
        const otherUserIds = Array.from(
          new Set(
            rawInvitations.flatMap((inv: any) => [inv.sender_id, inv.recipient_id])
          )
        ).filter(Boolean);

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .in('id', otherUserIds);

        const profileMap = new Map<string, { display_name: string; username: string | null; avatar_url: string | null }>();
        if (profiles) {
          for (const p of profiles) {
            profileMap.set(p.id, p);
          }
        }

        return rawInvitations.map((d: any) => {
          const senderProf = profileMap.get(d.sender_id);
          const recipientProf = profileMap.get(d.recipient_id);

          return {
            id: d.id,
            senderId: d.sender_id,
            recipientId: d.recipient_id,
            activityId: d.activity_id,
            activityTitle: d.activity_title,
            customNote: d.custom_note || undefined,
            status: d.status as InvitationStatus,
            meetingStatus: (d.meeting_status as MeetingStatus) || 'pending',
            headline: d.headline || undefined,
            acceptedAt: d.accepted_at || undefined,
            senderCelebratedAt: d.sender_celebrated_at || undefined,
            recipientCelebratedAt: d.recipient_celebrated_at || undefined,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            expiresAt: d.expires_at || undefined,
            senderDisplayName: senderProf?.display_name || 'Friend',
            senderUsername: senderProf?.username || null,
            senderAvatarUrl: senderProf?.avatar_url || undefined,
            recipientDisplayName: recipientProf?.display_name || 'Friend',
            recipientUsername: recipientProf?.username || null,
            recipientAvatarUrl: recipientProf?.avatar_url || undefined,
          };
        });
      } catch (err) {
        console.error('[BreakTym Invitation] getInvitations error:', err);
        return [];
      }
    }

    // Demo Mode: return demo invitations
    const demoList = this.getDemoInvitations();
    return demoList.filter((inv) => {
      if (filterMode === 'received') return inv.recipientId === userId;
      if (filterMode === 'sent') return inv.senderId === userId;
      if (filterMode === 'pending_received') return inv.recipientId === userId && (inv.status === 'pending' || inv.status === 'sent');
      return inv.senderId === userId || inv.recipientId === userId;
    });
  },

  /**
   * Responds to an invitation (accept or decline).
   * Responds to an invitation (accept or reject/decline).
   * Enforces recipient authorization and updates status in database.
   * On acceptance, initializes meeting_status to 'pending' and generates celebration payload.
   * On rejection, updates status to 'rejected' and meeting_status to 'cancelled'.
   */
  async respondToInvitation(
    invitationId: string,
    recipientId: string,
    status: 'accepted' | 'rejected' | 'declined',
    isDemo = false
  ): Promise<RespondInvitationResult> {
    if (!invitationId || !recipientId) {
      return { success: false, error: 'Invitation ID and Recipient ID are required.' };
    }

    const normalizedStatus = status === 'declined' ? 'rejected' : status;
    const isAccepted = normalizedStatus === 'accepted';

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        // 1. Try atomic RPC: respond_to_activity_invitation
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('respond_to_activity_invitation', {
          input_invitation_id: invitationId,
          input_status: normalizedStatus,
        });

        if (!rpcError && rpcData) {
          const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
          if (res.success) {
            const headline = res.headline || getCelebrationHeadline(invitationId);
            const nowIso = new Date().toISOString();

            const acceptedInv: ActivityInvitation | undefined = isAccepted
              ? {
                  id: invitationId,
                  senderId: res.sender_id || '',
                  recipientId: res.recipient_id || recipientId,
                  activityId: '',
                  activityTitle: res.activity_title || 'Break',
                  status: 'accepted',
                  meetingStatus: (res.meeting_status as MeetingStatus) || 'pending',
                  headline,
                  createdAt: nowIso,
                  acceptedAt: nowIso,
                  senderDisplayName: res.sender_name || 'Friend',
                  recipientDisplayName: res.recipient_name || 'You',
                }
              : undefined;

            return {
              success: true,
              message: res.message,
              invitationId,
              status: normalizedStatus,
              meetingStatus: (res.meeting_status as MeetingStatus) || (isAccepted ? 'pending' : 'cancelled'),
              headline,
              senderId: res.sender_id,
              recipientId: res.recipient_id,
              senderName: res.sender_name,
              recipientName: res.recipient_name,
              personalStreak: res.personal_streak,
              friendshipStreak: res.friendship_streak,
              invitation: acceptedInv,
            };
          }
          return { success: false, error: res.error || 'Failed to respond to invitation.' };
        }

        // 2. Direct table update fallback
        console.warn('[BreakTym Invitation] RPC respond_to_activity_invitation not available, using direct update fallback:', rpcError?.message);
        const headline = isAccepted ? getCelebrationHeadline(invitationId) : undefined;
        const nowIso = new Date().toISOString();

        const updateData: any = {
          status: normalizedStatus,
          updated_at: nowIso,
        };

        if (isAccepted) {
          updateData.meeting_status = 'pending';
          updateData.accepted_at = nowIso;
          updateData.headline = headline;
          // Note: recipient_celebrated_at remains NULL until acknowledged
        } else {
          updateData.meeting_status = 'cancelled';
        }

        const { error: updateError } = await supabase
          .from('activity_invitations')
          .update(updateData)
          .eq('id', invitationId)
          .eq('recipient_id', recipientId);

        if (updateError) {
          console.error('[BreakTym Invitation] Failed to update invitation:', updateError);
          return { success: false, error: updateError.message };
        }

        // Fetch fresh streak if accepted
        let streaks: InvitationStreaks = { personalStreak: 0, friendshipStreak: 0 };
        if (isAccepted) {
          streaks = await this.getInvitationStreaks(recipientId, undefined, false);
        }

        const fallbackInv: ActivityInvitation | undefined = isAccepted
          ? {
              id: invitationId,
              senderId: '',
              recipientId,
              activityId: '',
              activityTitle: 'Break',
              status: 'accepted',
              meetingStatus: 'pending',
              headline,
              createdAt: nowIso,
              acceptedAt: nowIso,
            }
          : undefined;

        return {
          success: true,
          message: isAccepted ? 'Break invitation accepted! Enjoy your break ✨' : 'Break invitation declined.',
          invitationId,
          status: normalizedStatus,
          meetingStatus: isAccepted ? 'pending' : 'cancelled',
          headline,
          recipientId,
          personalStreak: streaks.personalStreak,
          friendshipStreak: streaks.friendshipStreak,
          invitation: fallbackInv,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    // Demo Mode Update
    const list = this.getDemoInvitations();
    const targetInv = list.find((i) => i.id === invitationId);
    const headline = isAccepted ? getCelebrationHeadline(invitationId) : undefined;
    const nowIso = new Date().toISOString();

    // Idempotency: if already in target status, return existing without re-processing streaks
    if (targetInv && targetInv.status === normalizedStatus) {
      const streaks = this.calculateDemoStreaks(
        targetInv.senderId || 'demo_current_user',
        targetInv.recipientId
      );
      return {
        success: true,
        message: isAccepted ? 'Break invitation is already accepted.' : 'Break invitation is already declined.',
        invitationId,
        status: normalizedStatus,
        meetingStatus: targetInv.meetingStatus || (isAccepted ? 'pending' : 'cancelled'),
        headline: targetInv.headline || headline,
        senderId: targetInv.senderId,
        recipientId: targetInv.recipientId,
        senderName: targetInv.senderDisplayName,
        recipientName: targetInv.recipientDisplayName,
        personalStreak: streaks.personalStreak,
        friendshipStreak: streaks.friendshipStreak,
        invitation: targetInv,
      };
    }

    const updated = list.map((inv) =>
      inv.id === invitationId
        ? {
            ...inv,
            status: normalizedStatus as InvitationStatus,
            meetingStatus: (isAccepted ? 'pending' : 'cancelled') as MeetingStatus,
            acceptedAt: isAccepted ? nowIso : undefined,
            headline,
            updatedAt: nowIso,
          }
        : inv
    );
    localStorage.setItem(DEMO_INVITATIONS_KEY, JSON.stringify(updated));

    // Calculate streaks in demo mode
    const streaks = this.calculateDemoStreaks(
      targetInv?.senderId || 'demo_current_user',
      targetInv?.recipientId
    );

    const demoAcceptedInv: ActivityInvitation | undefined = targetInv
      ? {
          ...targetInv,
          status: normalizedStatus as InvitationStatus,
          meetingStatus: (isAccepted ? 'pending' : 'cancelled') as MeetingStatus,
          headline,
          acceptedAt: isAccepted ? nowIso : undefined,
        }
      : undefined;

    return {
      success: true,
      message: isAccepted ? 'Break invitation accepted! Enjoy your break ✨' : 'Break invitation declined.',
      invitationId,
      status: normalizedStatus,
      meetingStatus: isAccepted ? 'pending' : 'cancelled',
      headline,
      senderId: targetInv?.senderId,
      recipientId: targetInv?.recipientId,
      senderName: targetInv?.senderDisplayName,
      recipientName: targetInv?.recipientDisplayName,
      personalStreak: streaks.personalStreak,
      friendshipStreak: streaks.friendshipStreak,
      invitation: demoAcceptedInv,
    };
  },

  /**
   * Updates the meetup lifecycle (pending, completed, cancelled, missed)
   * separately from invitation status.
   */
  async updateMeetingStatus(
    invitationId: string,
    meetingStatus: MeetingStatus,
    isDemo = false
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    if (!invitationId) {
      return { success: false, error: 'Invitation ID is required.' };
    }

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('update_meeting_status', {
          input_invitation_id: invitationId,
          input_meeting_status: meetingStatus,
        });

        if (!rpcError && rpcData) {
          const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
          if (res.success) {
            return { success: true, message: res.message };
          }
          return { success: false, error: res.error || 'Failed to update meeting status.' };
        }

        // Direct table update fallback
        const { error: updateError } = await supabase
          .from('activity_invitations')
          .update({
            meeting_status: meetingStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invitationId);

        if (updateError) {
          return { success: false, error: updateError.message };
        }
        return { success: true, message: `Meeting status updated to ${meetingStatus}.` };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    // Demo mode: update in localStorage demo list
    const list = this.getDemoInvitations();
    const updated = list.map((inv) =>
      inv.id === invitationId
        ? {
            ...inv,
            meetingStatus,
            updatedAt: new Date().toISOString(),
          }
        : inv
    );
    localStorage.setItem(DEMO_INVITATIONS_KEY, JSON.stringify(updated));
    return { success: true, message: `Meeting status updated to ${meetingStatus}.` };
  },

  /**
   * Retrieves invitation acceptance streaks (Personal sent streak and Friendship pair streak).
   * Note: This is an accepted-invitations count streak, strictly non-daily.
   * Counts unique invitations accepted by recipient.
   */
  async getInvitationStreaks(
    userId: string,
    targetFriendId?: string,
    isDemo = false
  ): Promise<InvitationStreaks> {
    if (!userId) {
      return { personalStreak: 0, friendshipStreak: 0 };
    }

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        // 1. Try secure RPC: get_invitation_streaks
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_invitation_streaks', {
          target_friend_id: targetFriendId || null,
        });

        if (!rpcError && rpcData) {
          const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
          return {
            personalStreak: Number(res.personal_streak) || 0,
            friendshipStreak: Number(res.friendship_streak) || 0,
          };
        }

        // 2. Direct table count queries fallback
        const personalRes = await supabase
          .from('activity_invitations')
          .select('id', { count: 'exact', head: true })
          .eq('sender_id', userId)
          .eq('status', 'accepted');

        let friendshipCount = 0;
        if (targetFriendId) {
          const friendshipRes = await supabase
            .from('activity_invitations')
            .select('id', { count: 'exact', head: true })
            .or(
              `and(sender_id.eq.${userId},recipient_id.eq.${targetFriendId}),and(sender_id.eq.${targetFriendId},recipient_id.eq.${userId})`
            )
            .eq('status', 'accepted');
          friendshipCount = friendshipRes.count || 0;
        }

        return {
          personalStreak: personalRes.count || 0,
          friendshipStreak: friendshipCount,
        };
      } catch (err) {
        console.warn('[BreakTym Invitation] Error fetching streaks:', err);
      }
    }

    // Demo Mode derivation
    return this.calculateDemoStreaks(userId, targetFriendId);
  },

  /**
   * Helper to calculate streaks from demo storage
   */
  calculateDemoStreaks(userId: string, targetFriendId?: string): InvitationStreaks {
    const list = this.getDemoInvitations();
    const personalSet = new Set(
      list.filter((inv) => inv.senderId === userId && inv.status === 'accepted').map((i) => i.id)
    );

    let friendshipStreak = 0;
    if (targetFriendId) {
      const friendshipSet = new Set(
        list
          .filter(
            (inv) =>
              ((inv.senderId === userId && inv.recipientId === targetFriendId) ||
                (inv.senderId === targetFriendId && inv.recipientId === userId)) &&
              inv.status === 'accepted'
          )
          .map((i) => i.id)
      );
      friendshipStreak = friendshipSet.size;
    }

    return {
      personalStreak: personalSet.size,
      friendshipStreak,
    };
  },

  /**
   * Marks that the acceptance celebration has been displayed and acknowledged.
   * Prevents replaying on render, navigation, or app restart.
   */
  async markCelebrationSeen(
    invitationId: string,
    userId: string,
    role?: 'sender' | 'recipient',
    isDemo = false
  ): Promise<void> {
    if (!invitationId || !userId) return;

    // 1. Mark in client-side persistence immediately
    this.markCelebrationAcknowledgedLocally(invitationId, userId);

    // 2. Persist to Supabase if live
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { error } = await (supabase.rpc as any)('mark_invitation_celebrated', {
          input_invitation_id: invitationId,
          input_role: role || null,
        });

        if (error) {
          // Direct table fallback
          const updateField =
            role === 'recipient'
              ? { recipient_celebrated_at: new Date().toISOString() }
              : { sender_celebrated_at: new Date().toISOString() };
          await supabase.from('activity_invitations').update(updateField).eq('id', invitationId);
        }
      } catch (err) {
        console.warn('[BreakTym] Error persisting celebration acknowledgment to backend:', err);
      }
      return;
    }

    // Demo mode: update in localStorage demo list
    const list = this.getDemoInvitations();
    const updated = list.map((inv) => {
      if (inv.id === invitationId) {
        return {
          ...inv,
          senderCelebratedAt: role === 'sender' ? new Date().toISOString() : inv.senderCelebratedAt,
          recipientCelebratedAt: role === 'recipient' ? new Date().toISOString() : inv.recipientCelebratedAt,
        };
      }
      return inv;
    });
    localStorage.setItem(DEMO_INVITATIONS_KEY, JSON.stringify(updated));
  },

  isCelebrationAcknowledgedLocally(invitationId: string, userId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const key = `breaktym_celebrated_${userId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const set = JSON.parse(raw);
      return Array.isArray(set) && set.includes(invitationId);
    } catch {
      return false;
    }
  },

  markCelebrationAcknowledgedLocally(invitationId: string, userId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const key = `breaktym_celebrated_${userId}`;
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(invitationId)) {
        list.push(invitationId);
        // Retain last 100 acknowledged celebrations
        localStorage.setItem(key, JSON.stringify(list.slice(-100)));
      }
    } catch (err) {
      console.warn('Could not record celebration acknowledgment locally:', err);
    }
  },

  /**
   * Retrieves demo invitations stored in localStorage
   */
  getDemoInvitations(): ActivityInvitation[] {
    if (typeof window === 'undefined') return INITIAL_DEMO_INVITATIONS;
    const raw = localStorage.getItem(DEMO_INVITATIONS_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_INVITATIONS_KEY, JSON.stringify(INITIAL_DEMO_INVITATIONS));
      return INITIAL_DEMO_INVITATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DEMO_INVITATIONS;
    }
  },

  /**
   * Retrieves recorded recent invitations from local history
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
    if (typeof window === 'undefined') return;
    const list = this.getRecentInvitations();
    const updated = [invitation, ...list.filter((i) => i.id !== invitation.id)].slice(0, 20);
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(updated));
  },
};
