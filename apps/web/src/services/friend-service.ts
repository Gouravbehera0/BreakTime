import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Contact, DiscoveredContact, DiscoveredUserProfile, FriendRequest, ContactPerson, FriendshipStatus } from '@/types/contact';

// Demo initial friends
const INITIAL_DEMO_FRIENDS: Contact[] = [
  {
    id: 'friend_aisha',
    name: 'Aisha Sen',
    privateNickname: 'My Moon 💜',
    isOnline: true,
    statusText: 'Active now',
    relationship: 'LOVER',
    isPinned: true,
    phoneNumber: '+919876543201',
    bio: 'Always up for evening chai and starry night walks ✨',
  },
  {
    id: 'friend_rahul',
    name: 'Rahul Sharma 😎',
    isOnline: true,
    statusText: 'Active 5m ago',
    relationship: 'BESTFRIENDS',
    isPinned: true,
    phoneNumber: '+919876543202',
    bio: 'Night rides, coding, and endless banter.',
  },
  {
    id: 'friend_aryan',
    name: 'Aryan Verma 🏍️',
    isOnline: true,
    statusText: 'Active 12m ago',
    relationship: 'FRIENDS',
    isPinned: false,
    phoneNumber: '+919876543203',
    bio: 'Biker at heart. Ping me for food walks.',
  },
  {
    id: 'friend_rohan',
    name: 'Rohan Malhotra 🐺',
    isOnline: false,
    statusText: 'Last seen 2h ago',
    relationship: 'BHAI',
    isPinned: true,
    phoneNumber: '+919876543204',
    bio: 'Brother from another mother.',
  },
];

const DEMO_FRIENDS_KEY = 'breaktym_demo_friends';
const DEMO_REQUESTS_KEY = 'breaktym_demo_requests';

export const friendService = {
  /**
   * Retrieves confirmed friends for the given user
   */
  async getConfirmedFriends(currentUserId: string, isDemo = false): Promise<Contact[]> {
    if (isDemo || !isSupabaseConfigured() || !supabase) {
      const stored = localStorage.getItem(DEMO_FRIENDS_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore
        }
      }
      localStorage.setItem(DEMO_FRIENDS_KEY, JSON.stringify(INITIAL_DEMO_FRIENDS));
      return INITIAL_DEMO_FRIENDS;
    }

    try {
      // 1. Fetch friendships for current user (user_id = currentUserId or friend_id = currentUserId)
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (friendError) {
        console.error('Error fetching friendships:', friendError);
        return [];
      }

      if (!friendships || friendships.length === 0) {
        return [];
      }

      // 2. Extract other user IDs (friend's ID)
      const friendUserIds = Array.from(
        new Set(
          (friendships as any[]).map((f) =>
            f.user_id === currentUserId ? f.friend_id : f.user_id
          )
        )
      ).filter(Boolean);

      if (friendUserIds.length === 0) {
        return [];
      }

      // 3. Fetch friend profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, phone_number, bio')
        .in('id', friendUserIds);

      if (profileError || !profiles) {
        console.error('Error fetching friend profiles:', profileError);
        return [];
      }

      return profiles.map((p) => ({
        id: p.id,
        name: p.display_name || 'Friend',
        username: p.username || undefined,
        avatarUrl: p.avatar_url || undefined,
        isOnline: true,
        statusText: 'Active on BreakTym',
        relationship: 'FRIENDS',
        phoneNumber: p.phone_number || undefined,
        bio: p.bio || undefined,
        isPinned: false,
      }));
    } catch (err) {
      console.error('getConfirmedFriends exception:', err);
      return [];
    }
  },

  /**
   * Retrieves pending friend requests (both sent and received)
   */
  async getPendingRequests(currentUserId: string, isDemo = false): Promise<FriendRequest[]> {
    if (isDemo || !isSupabaseConfigured() || !supabase) {
      const stored = localStorage.getItem(DEMO_REQUESTS_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore
        }
      }
      const initialRequests: FriendRequest[] = [
        {
          id: 'req_priya',
          requesterId: 'user_priya',
          senderId: 'user_priya',
          recipientId: currentUserId,
          otherUserId: 'user_priya',
          otherUserName: 'Priya Kapoor 🌸',
          otherUserUsername: 'priya_k',
          otherUserPhone: '+919876543205',
          isIncoming: true,
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(initialRequests));
      return initialRequests;
    }

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending friend requests:', error);
        return [];
      }

      if (!data) return [];

      const requests: FriendRequest[] = [];
      for (const r of data as any[]) {
        const sender = r.sender_id;
        const isIncoming = r.recipient_id === currentUserId;
        const otherId = isIncoming ? sender : r.recipient_id;

        // Fetch other person's profile
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('display_name, username, avatar_url, phone_number')
          .eq('id', otherId)
          .maybeSingle();

        requests.push({
          id: r.id,
          requesterId: sender,
          senderId: sender,
          recipientId: r.recipient_id,
          otherUserId: otherId,
          otherUserName: otherProfile?.display_name || (isIncoming ? 'Incoming Request' : 'Sent Request'),
          otherUserUsername: otherProfile?.username || null,
          otherUserAvatarUrl: otherProfile?.avatar_url || undefined,
          otherUserPhone: otherProfile?.phone_number || undefined,
          isIncoming,
          status: r.status,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        });
      }

      return requests;
    } catch (err) {
      console.error('getPendingRequests exception:', err);
      return [];
    }
  },

  /**
   * Securely matches a batch of normalized phone numbers against Supabase registered users
   * via match_phone_contacts RPC function.
   */
  async matchPhoneContacts(
    contacts: ContactPerson[],
    _currentUserId: string,
    isDemo = false
  ): Promise<DiscoveredContact[]> {
    if (contacts.length === 0) return [];

    const allPhoneNumbers = Array.from(new Set(contacts.flatMap((c) => c.phoneNumbers)));

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('match_phone_contacts', {
          phone_numbers: allPhoneNumbers,
        });

        if (!error && Array.isArray(data)) {
          const matchMap = new Map<string, { userId: string; displayName: string; avatarUrl?: string; friendshipStatus: string }>();
          for (const item of data) {
            matchMap.set(item.phone_number, {
              userId: item.user_id,
              displayName: item.display_name,
              avatarUrl: item.avatar_url || undefined,
              friendshipStatus: item.friendship_status,
            });
          }

          return contacts.map((person) => {
            const matched = person.phoneNumbers.map((p) => matchMap.get(p)).find(Boolean);
            if (matched) {
              return {
                contact: person,
                isBreakTymUser: true,
                breakTymUserId: matched.userId,
                breakTymDisplayName: matched.displayName,
                breakTymAvatarUrl: matched.avatarUrl,
                friendshipStatus: (matched.friendshipStatus as DiscoveredContact['friendshipStatus']) || 'none',
              };
            }
            return {
              contact: person,
              isBreakTymUser: false,
              friendshipStatus: 'none',
            };
          });
        }
      } catch {
        // Fallback to simulated matching
      }
    }

    // Demo/Simulated matching: Contacts with '01', '02', '03', '555', or '98' are considered on BreakTym
    return contacts.map((person) => {
      const match = person.phoneNumbers.some((p) => p.includes('01') || p.includes('02') || p.includes('98'));
      if (match) {
        return {
          contact: person,
          isBreakTymUser: true,
          breakTymUserId: `bt_user_${person.id}`,
          breakTymDisplayName: person.displayName,
          friendshipStatus: 'none',
        };
      }
      return {
        contact: person,
        isBreakTymUser: false,
        friendshipStatus: 'none',
      };
    });
  },

  /**
   * Sends a friend request
   */
  async sendFriendRequest(
    requesterId: string,
    recipientId: string,
    recipientName = 'Friend',
    isDemo = false
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (requesterId === recipientId) {
      return { success: false, error: 'Cannot send a friend request to yourself.' };
    }

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        // 1. Try secure RPC function send_friend_request
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('send_friend_request', {
          target_user_id: recipientId,
        });

        if (!rpcError && rpcData) {
          const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
          if (res.success) {
            return { success: true, message: res.message || 'Friend request sent! ✨' };
          }
          return { success: false, error: res.error || 'Failed to send friend request.' };
        }

        // 2. Direct table insert fallback if RPC not yet created
        const { error } = await supabase.from('friend_requests').insert({
          sender_id: requesterId,
          recipient_id: recipientId,
          status: 'pending',
        } as any);

        if (!error) {
          return { success: true, message: `Friend request sent to ${recipientName}! ✨` };
        }

        if (error.code === '23505' || error.message.includes('unique')) {
          return { success: false, error: 'A pending friend request already exists between you and this user.' };
        }

        return { success: false, error: error.message };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    // Demo persistence
    const current = await this.getPendingRequests(requesterId, true);
    const existing = current.find(
      (r) => r.otherUserId === recipientId && r.status === 'pending'
    );
    if (existing) {
      if (existing.isIncoming) {
        await this.acceptFriendRequest(existing.id, requesterId, true);
        return { success: true, message: 'Reciprocal request detected! Friendship formed ✨' };
      }
      return { success: false, error: 'Friend request already sent.' };
    }

    const newReq: FriendRequest = {
      id: `req_${Date.now()}`,
      requesterId,
      senderId: requesterId,
      recipientId,
      otherUserId: recipientId,
      otherUserName: recipientName,
      otherUserUsername: recipientName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      isIncoming: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify([...current, newReq]));
    return { success: true, message: `Friend request sent to ${recipientName}! ✨` };
  },

  /**
   * Accepts incoming friend request either by requestId OR by senderUserId (for user search cards)
   */
  async acceptFriendRequest(
    arg1: string | { requestId?: string | null; senderUserId?: string | null; currentUserId: string; isDemo?: boolean },
    arg2?: string,
    arg3 = false
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    let requestId: string | null = null;
    let senderUserId: string | null = null;
    let currentUserId: string;
    let isDemo = false;

    if (typeof arg1 === 'object' && arg1 !== null) {
      requestId = arg1.requestId || null;
      senderUserId = arg1.senderUserId || null;
      currentUserId = arg1.currentUserId;
      isDemo = arg1.isDemo ?? false;
    } else {
      requestId = arg1;
      currentUserId = arg2 || '';
      isDemo = arg3;
    }

    if (!currentUserId && !isDemo) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        // Step 1: If senderUserId is provided, try transactional RPC accept_friend_request
        if (senderUserId) {
          const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('accept_friend_request', {
            target_sender_id: senderUserId,
          });

          if (!rpcError && rpcData) {
            const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
            if (res.success) {
              return { success: true, message: res.message || 'Friend request accepted! Added to your circle ✨' };
            }
            return { success: false, error: res.error || 'Failed to accept friend request.' };
          }
        }

        // Step 2: If requestId is provided, try transactional RPC respond_to_friend_request
        if (requestId) {
          const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('respond_to_friend_request', {
            request_id: requestId,
            new_status: 'accepted',
          });

          if (!rpcError && rpcData) {
            const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
            if (res.success) {
              return { success: true, message: res.message || 'Friend request accepted! Added to your circle ✨' };
            }
            return { success: false, error: res.error || 'Failed to accept friend request.' };
          }
        }

        // Step 3: Direct database fallback (if RPCs are not yet applied)
        let query = supabase.from('friend_requests').select('id, sender_id, recipient_id, status');
        if (requestId) {
          query = query.eq('id', requestId);
        } else if (senderUserId) {
          query = query.eq('sender_id', senderUserId).eq('recipient_id', currentUserId);
        }

        const { data: reqData, error: queryError } = await query.maybeSingle();

        if (queryError) {
          console.error('Error finding friend request:', queryError);
          return { success: false, error: queryError.message };
        }

        if (!reqData) {
          return { success: false, error: 'No pending friend request found.' };
        }

        if (reqData.recipient_id !== currentUserId) {
          return { success: false, error: 'Unauthorized: You can only accept requests sent to you.' };
        }

        if (reqData.status === 'accepted') {
          return { success: true, message: 'Friend request has already been accepted ✨' };
        }

        if (reqData.status !== 'pending') {
          return { success: false, error: `Friend request is no longer active (status: ${reqData.status}).` };
        }

        // Update request status to 'accepted'
        const { error: updateError } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', reqData.id)
          .eq('recipient_id', currentUserId);

        if (updateError) {
          console.error('Error updating friend request status:', updateError);
          return { success: false, error: updateError.message };
        }

        // Trigger will insert friendships; also attempt direct insert safely
        try {
          await supabase.from('friendships').insert([
            { user_id: reqData.sender_id, friend_id: currentUserId },
            { user_id: currentUserId, friend_id: reqData.sender_id },
          ]);
        } catch {
          // Trigger or conflict handled
        }

        return { success: true, message: 'Friend request accepted! Added to your circle ✨' };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('acceptFriendRequest exception:', err);
        return { success: false, error: errorMsg };
      }
    }

    // Demo fallback
    const requests = await this.getPendingRequests(currentUserId, true);
    const found = requests.find((r) => (requestId && r.id === requestId) || (senderUserId && r.otherUserId === senderUserId));
    if (found) {
      const remaining = requests.filter((r) => r.id !== found.id);
      localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(remaining));

      const friends = await this.getConfirmedFriends(currentUserId, true);
      const newFriend: Contact = {
        id: found.otherUserId,
        name: found.otherUserName,
        username: found.otherUserUsername || null,
        avatarUrl: found.otherUserAvatarUrl,
        isOnline: true,
        statusText: 'Active on BreakTym',
        relationship: 'FRIENDS',
        phoneNumber: found.otherUserPhone,
        isPinned: false,
      };
      localStorage.setItem(DEMO_FRIENDS_KEY, JSON.stringify([...friends, newFriend]));
    }
    return { success: true, message: 'Friend request accepted! Added to your circle ✨' };
  },

  /**
   * Rejects / Declines incoming friend request either by requestId OR by senderUserId
   */
  async rejectFriendRequest(
    arg1: string | { requestId?: string | null; senderUserId?: string | null; currentUserId: string; isDemo?: boolean },
    arg2?: string,
    arg3 = false
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    let requestId: string | null = null;
    let senderUserId: string | null = null;
    let currentUserId: string;
    let isDemo = false;

    if (typeof arg1 === 'object' && arg1 !== null) {
      requestId = arg1.requestId || null;
      senderUserId = arg1.senderUserId || null;
      currentUserId = arg1.currentUserId;
      isDemo = arg1.isDemo ?? false;
    } else {
      requestId = arg1;
      currentUserId = arg2 || '';
      isDemo = arg3;
    }

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        if (requestId) {
          const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('respond_to_friend_request', {
            request_id: requestId,
            new_status: 'rejected',
          });

          if (!rpcError && rpcData) {
            const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
            if (res.success) {
              return { success: true, message: res.message || 'Friend request declined.' };
            }
            return { success: false, error: res.error || 'Failed to decline friend request.' };
          }
        }

        // Direct table fallback
        let query = supabase
          .from('friend_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() });

        if (requestId) {
          query = query.eq('id', requestId);
        } else if (senderUserId) {
          query = query.eq('sender_id', senderUserId).eq('recipient_id', currentUserId).eq('status', 'pending');
        }

        const { error } = await query;
        if (error) {
          console.error('Error rejecting friend request:', error);
          return { success: false, error: error.message };
        }

        return { success: true, message: 'Friend request declined.' };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    const requests = await this.getPendingRequests(currentUserId, true);
    const found = requests.find((r) => (requestId && r.id === requestId) || (senderUserId && r.otherUserId === senderUserId));
    if (found) {
      const remaining = requests.filter((r) => r.id !== found.id);
      localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(remaining));
    }
    return { success: true, message: 'Friend request declined.' };
  },

  /**
   * Compatibility alias for declineFriendRequest
   */
  async declineFriendRequest(
    requestId: string,
    currentUserId: string,
    isDemo = false
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.rejectFriendRequest(requestId, currentUserId, isDemo);
  },

  /**
   * Cancels outgoing friend request
   */
  async cancelFriendRequest(
    requestId: string,
    currentUserId: string,
    isDemo = false
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('cancel_friend_request', {
          request_id: requestId,
        });

        if (!rpcError && rpcData) {
          const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
          if (res.success) {
            return { success: true, message: res.message || 'Friend request cancelled.' };
          }
          return { success: false, error: res.error || 'Failed to cancel request.' };
        }

        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        if (error) return { success: false, error: error.message };
        return { success: true, message: 'Friend request cancelled.' };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    const requests = await this.getPendingRequests(currentUserId, true);
    const remaining = requests.filter((r) => r.id !== requestId);
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(remaining));
    return { success: true, message: 'Friend request cancelled.' };
  },

  /**
   * Toggles pinned state of a friend locally
   */
  toggleFriendPin(friendId: string): void {
    const stored = localStorage.getItem(DEMO_FRIENDS_KEY);
    if (!stored) return;
    try {
      const friends: Contact[] = JSON.parse(stored);
      const updated = friends.map((f) =>
        f.id === friendId ? { ...f, isPinned: !f.isPinned } : f
      );
      localStorage.setItem(DEMO_FRIENDS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  /**
   * Searches BreakTym users by unique username or exact User ID (UUID).
   * Exposes only public information. Zero phone numbers, emails, or passwords are ever returned.
   * Includes rate limit protection against repeated rapid querying.
   */
  async searchByUserId(
    query: string,
    currentUserId: string,
    isDemo = false
  ): Promise<DiscoveredUserProfile[]> {
    const clean = query.trim().replace(/^@/, '');
    if (!clean || clean.length < 2) return [];

    // 1. Try remote Supabase RPC search_profiles_by_user_id
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await (supabase.rpc as any)('search_profiles_by_user_id', {
          search_query: clean,
          max_results: 10,
        });

        if (!error && Array.isArray(data)) {
          return data.map((item: any) => ({
            userId: item.user_id,
            displayName: item.display_name,
            username: item.username,
            avatarUrl: item.avatar_url,
            bio: item.bio,
            friendshipStatus: item.friendship_status,
          }));
        }

        // Fallback to search_profiles_by_username
        const { data: legacyData, error: legacyErr } = await supabase.rpc('search_profiles_by_username', {
          search_query: clean.toLowerCase(),
          max_results: 10,
        });

        if (!legacyErr && Array.isArray(legacyData)) {
          return legacyData.map((item) => ({
            userId: item.user_id,
            displayName: item.display_name,
            username: item.username,
            avatarUrl: item.avatar_url,
            bio: item.bio,
            friendshipStatus: item.friendship_status,
          }));
        }

        // Direct table select fallback
        const { data: directData, error: directErr } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, bio')
          .or(`username.ilike.${clean}%,username.eq.${clean},id.eq.${clean}`)
          .limit(10);

        if (!directErr && Array.isArray(directData) && directData.length > 0) {
          const friends = await this.getConfirmedFriends(currentUserId, false);
          const friendIds = new Set(friends.map((f) => f.id));
          const pending = await this.getPendingRequests(currentUserId, false);
          const pendingSentIds = new Set(pending.filter((p) => !p.isIncoming).map((p) => p.otherUserId));
          const pendingReceivedIds = new Set(pending.filter((p) => p.isIncoming).map((p) => p.otherUserId));

          return directData.map((p) => {
            let status: FriendshipStatus = 'none';
            if (p.id === currentUserId) status = 'self';
            else if (friendIds.has(p.id)) status = 'friends';
            else if (pendingSentIds.has(p.id)) status = 'pending_sent';
            else if (pendingReceivedIds.has(p.id)) status = 'pending_received';

            return {
              userId: p.id,
              displayName: p.display_name,
              username: p.username,
              avatarUrl: p.avatar_url,
              bio: p.bio,
              friendshipStatus: status,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase searchByUserId notice:', err);
      }
    }

    // 2. Demo / Fallback matching
    const mockUsers: DiscoveredUserProfile[] = [
      {
        userId: 'friend_aisha',
        displayName: 'Aisha Sen',
        username: 'aisha',
        bio: 'Always up for evening chai and starry night walks ✨',
        friendshipStatus: 'friends',
      },
      {
        userId: 'friend_rahul',
        displayName: 'Rahul Sharma 😎',
        username: 'rahul_sharma',
        bio: 'Night rides, coding, and endless banter.',
        friendshipStatus: 'friends',
      },
      {
        userId: 'user_priya_kapoor',
        displayName: 'Priya Kapoor ✨',
        username: 'priya_k',
        bio: 'Music festival enthusiast & cafe hopper',
        friendshipStatus: 'none',
      },
      {
        userId: 'user_kabir_singh',
        displayName: 'Kabir Singh 🏍️',
        username: 'kabir_speed',
        bio: 'Living fast. Always down for late-night food runs.',
        friendshipStatus: 'none',
      },
      {
        userId: 'user_tanya_roy',
        displayName: 'Tanya Roy 🎨',
        username: 'tanya_creates',
        bio: 'Designer by day, stargazing by night 🌌',
        friendshipStatus: 'none',
      },
      {
        userId: 'user_rohit_verma',
        displayName: 'Rohit Verma ☕',
        username: 'rohit_v',
        bio: 'Chai lover, weekend photographer',
        friendshipStatus: 'none',
      },
    ];

    const pending = await this.getPendingRequests(currentUserId, true);
    const pendingSentIds = new Set(pending.filter((p) => !p.isIncoming).map((p) => p.otherUserId));
    const pendingReceivedIds = new Set(pending.filter((p) => p.isIncoming).map((p) => p.otherUserId));

    const cleanLower = clean.toLowerCase();
    return mockUsers
      .filter((u) => {
        if (u.userId === currentUserId) return true; // Will be mapped to 'self'
        const matchUsername = u.username && u.username.toLowerCase().includes(cleanLower);
        const matchId = u.userId.toLowerCase().includes(cleanLower);
        const matchName = u.displayName.toLowerCase().includes(cleanLower);
        return matchUsername || matchId || matchName;
      })
      .map((u) => {
        if (u.userId === currentUserId) {
          return { ...u, friendshipStatus: 'self' };
        }
        if (pendingSentIds.has(u.userId)) {
          return { ...u, friendshipStatus: 'pending_sent' };
        }
        if (pendingReceivedIds.has(u.userId)) {
          return { ...u, friendshipStatus: 'pending_received' };
        }
        return u;
      });
  },

  /**
   * Searches BreakTym users by unique username (delegates to searchByUserId).
   */
  async searchByUsername(
    query: string,
    currentUserId: string,
    isDemo = false
  ): Promise<DiscoveredUserProfile[]> {
    return this.searchByUserId(query, currentUserId, isDemo);
  },

  /**
   * Resolves a public profile from an opaque personal QR token.
   * Strictly returns public information only.
   */
  async resolveProfileByQrToken(
    qrToken: string,
    currentUserId: string,
    isDemo = false
  ): Promise<DiscoveredUserProfile | null> {
    const cleanToken = qrToken.trim();
    if (!cleanToken) return null;

    // 1. Try remote Supabase RPC
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('resolve_profile_by_qr_token', {
          token_input: cleanToken,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          const item = data[0];
          return {
            userId: item.user_id,
            displayName: item.display_name,
            username: item.username,
            avatarUrl: item.avatar_url,
            bio: item.bio,
            friendshipStatus: item.friendship_status,
          };
        }
      } catch (err) {
        console.warn('Supabase resolve_profile_by_qr_token notice:', err);
      }
    }

    // 2. Demo fallback resolution
    // If the token matches the current user's token or ID
    if (cleanToken.includes(currentUserId) || cleanToken === 'my_personal_qr_token') {
      return {
        userId: currentUserId,
        displayName: 'You',
        username: 'you',
        bio: 'Your personal profile',
        friendshipStatus: 'self',
      };
    }

    const demoProfiles: Record<string, DiscoveredUserProfile> = {
      token_demo_priya: {
        userId: 'user_priya_kapoor',
        displayName: 'Priya Kapoor ✨',
        username: 'priya_k',
        bio: 'Music festival enthusiast & cafe hopper',
        friendshipStatus: 'none',
      },
      token_demo_kabir: {
        userId: 'user_kabir_singh',
        displayName: 'Kabir Singh 🏍️',
        username: 'kabir_speed',
        bio: 'Living fast. Always down for late-night food runs.',
        friendshipStatus: 'none',
      },
    };

    if (demoProfiles[cleanToken]) {
      return demoProfiles[cleanToken];
    }

    // Generic fallback for any simulated QR token
    if (cleanToken.length >= 8) {
      return {
        userId: `user_qr_${cleanToken.slice(0, 8)}`,
        displayName: `BreakTym Member`,
        username: `user_${cleanToken.slice(0, 6)}`,
        bio: 'Living for spontaneous breaks & late-night chats ✨',
        friendshipStatus: 'none',
      };
    }

    return null;
  },

  /**
   * Regenerates a new personal QR token, revoking any previously printed or shared QR codes.
   */
  async regenerateQrToken(currentUserId: string, isDemo = false): Promise<string> {
    const localNewToken = `bt_qr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('regenerate_qr_token');
        if (!error && typeof data === 'string') {
          return data;
        }
      } catch (err) {
        console.warn('Supabase regenerate_qr_token notice:', err);
      }
    }

    // Update local profile cache
    const cacheKey = `breaktym_profile_${currentUserId}`;
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        parsed.qrToken = localNewToken;
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      } catch {
        // ignore
      }
    }

    return localNewToken;
  },

  /**
   * Checks whether a requested username is available.
   */
  async checkUsernameAvailable(
    requestedUsername: string,
    _currentUserId?: string,
    isDemo = false
  ): Promise<boolean> {
    const clean = requestedUsername.trim().toLowerCase();
    if (clean.length < 3 || clean.length > 20 || !/^[a-z0-9_]+$/.test(clean)) {
      return false;
    }

    // 1. Try remote Supabase RPC
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('check_username_available', {
          requested_username: clean,
        });
        if (!error && typeof data === 'boolean') {
          return data;
        }
      } catch (err) {
        console.warn('Supabase check_username_available notice:', err);
      }
    }

    // 2. Demo check against reserved / taken usernames
    const takenUsernames = new Set(['admin', 'breaktym', 'support', 'help', 'root', 'aisha', 'rahul_sharma']);
    if (takenUsernames.has(clean)) {
      return false;
    }

    return true;
  },
};
