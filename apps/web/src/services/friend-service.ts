import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Contact, DiscoveredContact, FriendRequest, ContactPerson } from '@/types/contact';

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
      // 1. Fetch friendships
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user_id1, user_id2')
        .or(`user_id1.eq.${currentUserId},user_id2.eq.${currentUserId}`);

      if (friendError || !friendships || friendships.length === 0) {
        return [];
      }

      // 2. Extract other user IDs
      const friendUserIds = friendships.map((f) =>
        f.user_id1 === currentUserId ? f.user_id2 : f.user_id1
      );

      // 3. Fetch friend profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendUserIds);

      if (profileError || !profiles) {
        return [];
      }

      return profiles.map((p) => ({
        id: p.id,
        name: p.display_name || 'Friend',
        avatarUrl: p.avatar_url,
        isOnline: true, // Presence can be integrated
        statusText: 'Active on BreakTym',
        relationship: 'FRIENDS',
        phoneNumber: p.phone_number,
        bio: p.bio,
        isPinned: false,
      }));
    } catch {
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
          recipientId: currentUserId,
          otherUserId: 'user_priya',
          otherUserName: 'Priya Kapoor 🌸',
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
        .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .eq('status', 'pending');

      if (error || !data) return [];

      const requests: FriendRequest[] = [];
      for (const r of data) {
        const isIncoming = r.recipient_id === currentUserId;
        const otherId = isIncoming ? r.requester_id : r.recipient_id;

        // Fetch other person's name
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, phone_number')
          .eq('id', otherId)
          .maybeSingle();

        requests.push({
          id: r.id,
          requesterId: r.requester_id,
          recipientId: r.recipient_id,
          otherUserId: otherId,
          otherUserName: otherProfile?.display_name || (isIncoming ? 'Incoming Request' : 'Sent Request'),
          otherUserAvatarUrl: otherProfile?.avatar_url,
          otherUserPhone: otherProfile?.phone_number,
          isIncoming,
          status: r.status,
          createdAt: r.created_at,
        });
      }

      return requests;
    } catch {
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
          const matchMap = new Map<string, { userId: string; displayName: string; avatarUrl: string; friendshipStatus: string }>();
          for (const item of data) {
            matchMap.set(item.phone_number, {
              userId: item.user_id,
              displayName: item.display_name,
              avatarUrl: item.avatar_url,
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
  ): Promise<{ success: boolean; error?: string }> {
    if (requesterId === recipientId) {
      return { success: false, error: 'Cannot send a friend request to yourself.' };
    }

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('friend_requests').insert({
          requester_id: requesterId,
          recipient_id: recipientId,
          status: 'pending',
        });

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    // Demo persistence
    const current = await this.getPendingRequests(requesterId, true);
    const newReq: FriendRequest = {
      id: `req_${Date.now()}`,
      requesterId,
      recipientId,
      otherUserId: recipientId,
      otherUserName: recipientName,
      isIncoming: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify([...current, newReq]));
    return { success: true };
  },

  /**
   * Accepts incoming friend request
   */
  async acceptFriendRequest(
    requestId: string,
    currentUserId: string,
    isDemo = false
  ): Promise<{ success: boolean; error?: string }> {
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted' })
          .eq('id', requestId)
          .eq('recipient_id', currentUserId);

        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    // Demo fallback
    const requests = await this.getPendingRequests(currentUserId, true);
    const found = requests.find((r) => r.id === requestId);
    if (found) {
      const remaining = requests.filter((r) => r.id !== requestId);
      localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(remaining));

      const friends = await this.getConfirmedFriends(currentUserId, true);
      const newFriend: Contact = {
        id: found.otherUserId,
        name: found.otherUserName,
        avatarUrl: found.otherUserAvatarUrl,
        isOnline: true,
        statusText: 'Active on BreakTym',
        relationship: 'FRIENDS',
        phoneNumber: found.otherUserPhone,
        isPinned: false,
      };
      localStorage.setItem(DEMO_FRIENDS_KEY, JSON.stringify([...friends, newFriend]));
    }
    return { success: true };
  },

  /**
   * Declines incoming friend request
   */
  async declineFriendRequest(
    requestId: string,
    currentUserId: string,
    isDemo = false
  ): Promise<{ success: boolean; error?: string }> {
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'declined' })
          .eq('id', requestId)
          .eq('recipient_id', currentUserId);

        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    const requests = await this.getPendingRequests(currentUserId, true);
    const remaining = requests.filter((r) => r.id !== requestId);
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(remaining));
    return { success: true };
  },

  /**
   * Cancels outgoing friend request
   */
  async cancelFriendRequest(
    requestId: string,
    currentUserId: string,
    isDemo = false
  ): Promise<{ success: boolean; error?: string }> {
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'cancelled' })
          .eq('id', requestId)
          .eq('requester_id', currentUserId);

        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    const requests = await this.getPendingRequests(currentUserId, true);
    const remaining = requests.filter((r) => r.id !== requestId);
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(remaining));
    return { success: true };
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
};
