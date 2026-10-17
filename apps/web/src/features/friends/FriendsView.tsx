import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Check,
  X,
  UserPlus,
  QrCode,
  Camera,
  Phone,
  AtSign,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Contact, FriendRequest, DiscoveredContact, DiscoveredUserProfile, ContactPerson } from '@/types/contact';
import { UserProfile } from '@/types/auth';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { NeomorphicInput } from '@/components/ui/NeomorphicInput';
import { Avatar } from '@/components/ui/Avatar';
import { RelationshipBadge } from '@/components/ui/RelationshipBadge';
import {
  isContactPickerSupported,
  pickPhoneContacts,
  normalizePhoneNumber,
} from '@/lib/contact-picker';
import { friendService } from '@/services/friend-service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MyQRCodeModal } from './MyQRCodeModal';
import { QRScannerModal } from './QRScannerModal';
import { TargetProfileModal } from './TargetProfileModal';

interface FriendsViewProps {
  currentUserId: string;
  userProfile?: UserProfile | null;
  confirmedFriends: Contact[];
  pendingRequests: FriendRequest[];
  onRefresh: () => void;
  onInviteToBreak: (contact: Contact) => void;
  userName?: string;
  isDemo?: boolean;
  hasLinkedPhone?: boolean;
  onLinkPhoneClick?: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

type DiscoveryTab = 'userid' | 'qr' | 'contacts';
type RequestTab = 'received' | 'sent';

export const FriendsView: React.FC<FriendsViewProps> = ({
  currentUserId,
  userProfile,
  confirmedFriends,
  pendingRequests,
  onRefresh,
  onInviteToBreak,
  isDemo = false,
  hasLinkedPhone = true,
  onLinkPhoneClick,
  onProfileUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Friend Requests Tab: 'received' | 'sent'
  const [requestTab, setRequestTab] = useState<RequestTab>('received');

  // Discovery Sub-tab: 'userid' | 'qr' | 'contacts'
  const [discoveryTab, setDiscoveryTab] = useState<DiscoveryTab>('userid');

  // QR Modals
  const [showMyQRModal, setShowMyQRModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedQrToken, setScannedQrToken] = useState<string | null>(null);

  // User ID Search State
  const [userIdInput, setUserIdInput] = useState('');
  const [userIdResults, setUserIdResults] = useState<DiscoveredUserProfile[]>([]);
  const [isSearchingUserId, setIsSearchingUserId] = useState(false);
  const [hasSearchedUserId, setHasSearchedUserId] = useState(false);
  const [searchValidationError, setSearchValidationError] = useState<string | null>(null);
  const [sendingRequestUserIds, setSendingRequestUserIds] = useState<Set<string>>(new Set());
  const [processingActionUserIds, setProcessingActionUserIds] = useState<Set<string>>(new Set());
  const lastSearchTimeRef = useRef<number>(0);

  // Phone Contacts Discovery State
  const [isMatchingContacts, setIsMatchingContacts] = useState(false);
  const [discoveredContacts, setDiscoveredContacts] = useState<DiscoveredContact[]>([]);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');

  // Real-time Supabase subscriptions for friend_requests and friendships
  useEffect(() => {
    if (isDemo || !isSupabaseConfigured() || !supabase) return;
    const client = supabase;

    const channel = client
      .channel(`realtime_friends_channel_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
        },
        () => {
          onRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          onRefresh();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [currentUserId, isDemo, onRefresh]);

  // Filter confirmed friends by search query
  const filteredFriends = confirmedFriends.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.username && f.username.toLowerCase().includes(q)) ||
      f.relationship.toLowerCase().includes(q) ||
      f.phoneNumber?.includes(q)
    );
  });

  // Separate pending requests into Received and Sent
  const receivedRequests = pendingRequests.filter((r) => r.isIncoming);
  const sentRequests = pendingRequests.filter((r) => !r.isIncoming);

  // Handle Search by User ID / Username with Rate-Limit & Validation
  const handleSearchUserId = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchValidationError(null);

    const clean = userIdInput.trim();
    if (!clean) {
      setSearchValidationError('Please enter a username or user ID.');
      return;
    }

    if (clean.length < 2) {
      setSearchValidationError('Invalid username: must be at least 2 characters.');
      return;
    }

    // Rate limiting: 600ms cooldown between searches to prevent abuse
    const now = Date.now();
    if (now - lastSearchTimeRef.current < 600) {
      setNotice('Searching too quickly. Please wait a moment.');
      return;
    }
    lastSearchTimeRef.current = now;

    setIsSearchingUserId(true);
    setNotice(null);
    setHasSearchedUserId(true);

    try {
      const results = await friendService.searchByUserId(clean, currentUserId, isDemo);
      setUserIdResults(results);
    } catch {
      setUserIdResults([]);
      setNotice('An error occurred during search. Please try again.');
    } finally {
      setIsSearchingUserId(false);
    }
  };

  // Send friend request to a user ID search result
  const handleSendRequestToUser = async (user: DiscoveredUserProfile) => {
    setSendingRequestUserIds((prev) => new Set(prev).add(user.userId));
    setNotice(null);

    const res = await friendService.sendFriendRequest(
      currentUserId,
      user.userId,
      user.displayName,
      isDemo
    );

    setSendingRequestUserIds((prev) => {
      const next = new Set(prev);
      next.delete(user.userId);
      return next;
    });

    if (res.success) {
      setNotice(res.message || `Friend request sent to ${user.displayName}! ✨`);
      setUserIdResults((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, friendshipStatus: 'pending_sent' } : u))
      );
      onRefresh();
    } else {
      setNotice(res.error || 'Failed to send friend request.');
    }
  };

  // Handle QR scan result
  const handleScanSuccess = (token: string) => {
    setShowScannerModal(false);
    setScannedQrToken(token);
  };

  // Handle browser Contact Picker API
  const handleLaunchContactPicker = async () => {
    setIsMatchingContacts(true);
    setNotice(null);

    const result = await pickPhoneContacts();
    if (!result.supported) {
      setIsMatchingContacts(false);
      setNotice('Contact Picker API is not supported in this desktop browser. You can enter phone numbers directly below, search by User ID, or scan a personal QR code.');
      return;
    }

    if (result.error) {
      setIsMatchingContacts(false);
      setNotice(result.error);
      return;
    }

    if (result.contacts.length === 0) {
      setIsMatchingContacts(false);
      setNotice('No contacts were selected.');
      return;
    }

    const matched = await friendService.matchPhoneContacts(
      result.contacts,
      currentUserId,
      isDemo
    );
    setIsMatchingContacts(false);
    setDiscoveredContacts(matched);
  };

  // Handle manual single contact lookup
  const handleManualAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone.trim()) return;

    setIsMatchingContacts(true);
    setNotice(null);

    const normalized = normalizePhoneNumber(manualPhone);
    const mockPerson: ContactPerson = {
      id: `manual_${Date.now()}`,
      displayName: manualName.trim() || 'Contact',
      phoneNumbers: [normalized],
    };

    const matched = await friendService.matchPhoneContacts([mockPerson], currentUserId, isDemo);
    setIsMatchingContacts(false);
    setDiscoveredContacts(matched);
  };

  // Send friend request from contact match
  const handleSendFriendRequestToContact = async (recipientId: string, recipientName: string) => {
    const res = await friendService.sendFriendRequest(currentUserId, recipientId, recipientName, isDemo);
    if (res.success) {
      setDiscoveredContacts((prev) =>
        prev.map((d) =>
          d.breakTymUserId === recipientId
            ? { ...d, friendshipStatus: 'pending_sent' }
            : d
        )
      );
      setNotice(res.message || `Friend request sent to ${recipientName}! ✨`);
      onRefresh();
    } else {
      setNotice(res.error || 'Failed to send request.');
    }
  };

  const handleAcceptRequest = async (requestId?: string | null, senderUserId?: string | null) => {
    const actionKey = senderUserId || requestId || 'action';
    if (processingActionUserIds.has(actionKey)) return;

    setProcessingActionUserIds((prev) => new Set(prev).add(actionKey));
    setNotice(null);

    const res = await friendService.acceptFriendRequest({
      requestId,
      senderUserId,
      currentUserId,
      isDemo,
    });

    setProcessingActionUserIds((prev) => {
      const next = new Set(prev);
      next.delete(actionKey);
      return next;
    });

    if (res.success) {
      setNotice(res.message || 'Friend request accepted! Added to your circle ✨');
      // If the accepted user is in search results, update status immediately to 'friends'
      setUserIdResults((prev) =>
        prev.map((u) =>
          (senderUserId && u.userId === senderUserId) || (requestId && pendingRequests.find((r) => r.id === requestId)?.otherUserId === u.userId)
            ? { ...u, friendshipStatus: 'friends' }
            : u
        )
      );
      onRefresh();
    } else {
      setNotice(res.error || 'Failed to accept friend request.');
      // If no request found or was cancelled, update card status to none
      if (res.error?.includes('No pending') || res.error?.includes('no longer') || res.error?.includes('cancelled')) {
        setUserIdResults((prev) =>
          prev.map((u) =>
            (senderUserId && u.userId === senderUserId) ? { ...u, friendshipStatus: 'none' } : u
          )
        );
      }
    }
  };

  const handleRejectRequest = async (requestId?: string | null, senderUserId?: string | null) => {
    const actionKey = senderUserId || requestId || 'action';
    if (processingActionUserIds.has(actionKey)) return;

    setProcessingActionUserIds((prev) => new Set(prev).add(actionKey));
    setNotice(null);

    const res = await friendService.rejectFriendRequest({
      requestId,
      senderUserId,
      currentUserId,
      isDemo,
    });

    setProcessingActionUserIds((prev) => {
      const next = new Set(prev);
      next.delete(actionKey);
      return next;
    });

    if (res.success) {
      setNotice(res.message || 'Friend request declined.');
      setUserIdResults((prev) =>
        prev.map((u) =>
          (senderUserId && u.userId === senderUserId) || (requestId && pendingRequests.find((r) => r.id === requestId)?.otherUserId === u.userId)
            ? { ...u, friendshipStatus: 'none' }
            : u
        )
      );
      onRefresh();
    } else {
      setNotice(res.error || 'Failed to decline request.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (processingActionUserIds.has(requestId)) return;
    setProcessingActionUserIds((prev) => new Set(prev).add(requestId));
    setNotice(null);

    const res = await friendService.cancelFriendRequest(requestId, currentUserId, isDemo);

    setProcessingActionUserIds((prev) => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });

    if (res.success) {
      setNotice(res.message || 'Friend request cancelled.');
      setUserIdResults((prev) =>
        prev.map((u) => (u.friendshipStatus === 'pending_sent' ? { ...u, friendshipStatus: 'none' } : u))
      );
      onRefresh();
    } else {
      setNotice(res.error || 'Failed to cancel request.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-7 text-left">
      {/* 1. Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FA] tracking-tight">
            Your Circles & Friends
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A0B5] mt-0.5">
            Connect by User ID, handle, QR code, or phone contacts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <NeomorphicButton
            variant="secondary"
            onClick={() => setShowMyQRModal(true)}
            icon={<QrCode className="w-3.5 h-3.5 text-[#B45CFF]" />}
            className="text-xs py-2 px-3.5 border-[#B45CFF]/40"
          >
            My QR Code
          </NeomorphicButton>

          <NeomorphicButton
            variant="secondary"
            onClick={() => setShowScannerModal(true)}
            icon={<Camera className="w-3.5 h-3.5 text-[#86EFAC]" />}
            className="text-xs py-2 px-3.5"
          >
            Scan QR
          </NeomorphicButton>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-[#B45CFF]/15 border border-[#B45CFF]/30 text-xs text-[#F5F3FA] flex items-center justify-between animate-in fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[#A5A0B5] hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. FRIEND REQUEST MANAGEMENT (Received & Sent Tabs) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#A5A0B5]">
              Friend Requests
            </h2>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#B45CFF]/20 text-[#B45CFF] text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </div>
        </div>

        {/* Tab Toggle: Received vs Sent */}
        <NeomorphicCard className="p-4 space-y-3.5">
          <div className="flex p-1 rounded-xl bg-[#1C1C23] border border-[#30303A] gap-1">
            <button
              type="button"
              onClick={() => setRequestTab('received')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                requestTab === 'received'
                  ? 'bg-[#202027] text-[#B45CFF] shadow-[-2px_-2px_6px_#30303A,2px_2px_6px_#101014] border border-[#B45CFF]/40'
                  : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
              }`}
            >
              <span>Received</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  requestTab === 'received' ? 'bg-[#B45CFF]/20 text-[#B45CFF]' : 'bg-white/10 text-[#A5A0B5]'
                }`}
              >
                {receivedRequests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRequestTab('sent')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                requestTab === 'sent'
                  ? 'bg-[#202027] text-[#B45CFF] shadow-[-2px_-2px_6px_#30303A,2px_2px_6px_#101014] border border-[#B45CFF]/40'
                  : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
              }`}
            >
              <span>Sent</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  requestTab === 'sent' ? 'bg-[#B45CFF]/20 text-[#B45CFF]' : 'bg-white/10 text-[#A5A0B5]'
                }`}
              >
                {sentRequests.length}
              </span>
            </button>
          </div>

          {/* Tab 1: Received Requests */}
          {requestTab === 'received' && (
            <div>
              {receivedRequests.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs font-semibold text-[#F5F3FA]">No incoming friend requests</p>
                  <p className="text-[11px] text-[#A5A0B5]">
                    Share your username or User ID with friends to receive invitations.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {receivedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-[#1B1B22] border border-[#30303A]/70 flex items-center justify-between gap-3 shadow-[-2px_-2px_6px_#282833,2px_2px_6px_#101014]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={req.otherUserName} avatarUrl={req.otherUserAvatarUrl} size="sm" isOnline={true} />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[#F5F3FA] truncate">
                            {req.otherUserName}
                          </p>
                          <p className="text-[11px] text-[#B45CFF] font-semibold truncate">
                            @{req.otherUserUsername || req.otherUserName.toLowerCase().replace(/[^a-z0-9_]/g, '')}
                          </p>
                          <p className="text-[10px] text-[#A5A0B5]">Wants to connect</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req.id, req.otherUserId)}
                          disabled={processingActionUserIds.has(req.id) || processingActionUserIds.has(req.otherUserId)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#86EFAC]/15 hover:bg-[#86EFAC]/25 disabled:opacity-50 text-[#86EFAC] text-xs font-semibold border border-[#86EFAC]/30 transition-all shadow-[0_0_8px_rgba(134,239,172,0.2)]"
                          title="Accept friend request"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{processingActionUserIds.has(req.id) || processingActionUserIds.has(req.otherUserId) ? 'Accepting...' : 'Accept'}</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id, req.otherUserId)}
                          disabled={processingActionUserIds.has(req.id) || processingActionUserIds.has(req.otherUserId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 disabled:opacity-50 text-[#FF6B81] text-xs font-semibold border border-red-500/30 transition-all"
                          title="Reject friend request"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Sent Requests */}
          {requestTab === 'sent' && (
            <div>
              {sentRequests.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs font-semibold text-[#F5F3FA]">No pending sent requests</p>
                  <p className="text-[11px] text-[#A5A0B5]">
                    Requests you send to others by User ID or username will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-[#1B1B22] border border-[#30303A]/70 flex items-center justify-between gap-3 shadow-[-2px_-2px_6px_#282833,2px_2px_6px_#101014]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={req.otherUserName} avatarUrl={req.otherUserAvatarUrl} size="sm" isOnline={true} />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[#F5F3FA] truncate">
                            {req.otherUserName}
                          </p>
                          <p className="text-[11px] text-[#B45CFF] font-semibold truncate">
                            @{req.otherUserUsername || req.otherUserName.toLowerCase().replace(/[^a-z0-9_]/g, '')}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Pending Response</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <NeomorphicButton
                          variant="ghost"
                          onClick={() => handleCancelRequest(req.id)}
                          className="text-xs py-1.5 px-3 text-[#A5A0B5] hover:text-[#FF6B81] border border-white/5"
                        >
                          Cancel Request
                        </NeomorphicButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </NeomorphicCard>
      </div>

      {/* 3. CONFIRMED FRIENDS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#A5A0B5]">
              Your Friends
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#F5F3FA] text-[10px] font-bold">
              {confirmedFriends.length}
            </span>
          </div>

          {confirmedFriends.length > 0 && (
            <div className="relative w-44 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A5A0B5]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter friends..."
                className="w-full bg-[#1B1B22] text-[#F5F3FA] placeholder-[#7E7991] text-xs rounded-lg py-1.5 pl-8 pr-3 
                border border-[#34313D] focus:border-[#B45CFF] outline-none"
              />
            </div>
          )}
        </div>

        {filteredFriends.length === 0 ? (
          <NeomorphicCard className="p-6 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#B45CFF]/10 flex items-center justify-center text-[#B45CFF]">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#F5F3FA]">
              {searchQuery ? `No friends matching "${searchQuery}"` : 'No confirmed friends in your circle yet'}
            </p>
            <p className="text-[11px] text-[#A5A0B5] max-w-sm mx-auto">
              Add friends using Search by User ID, scanning a QR code, or syncing phone contacts below.
            </p>
          </NeomorphicCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredFriends.map((friend) => (
              <NeomorphicCard
                key={friend.id}
                interactive={true}
                className="p-3.5 flex items-center justify-between gap-3"
                onClick={() => onInviteToBreak(friend)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={friend.name}
                    avatarUrl={friend.avatarUrl}
                    size="sm"
                    isOnline={friend.isOnline}
                    showStatus={true}
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#F5F3FA] truncate">
                      {friend.privateNickname || friend.name}
                    </p>
                    {friend.username && (
                      <p className="text-[11px] text-[#B45CFF] font-semibold truncate">
                        @{friend.username}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <RelationshipBadge relationship={friend.relationship} />
                    </div>
                  </div>
                </div>

                <NeomorphicButton
                  variant="primary"
                  className="px-3 py-1.5 text-xs shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInviteToBreak(friend);
                  }}
                >
                  Invite
                </NeomorphicButton>
              </NeomorphicCard>
            ))}
          </div>
        )}
      </div>

      {/* 4. DISCOVER & ADD FRIENDS (Search by User ID, QR, Contacts) */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div>
          <h2 className="text-sm font-bold text-[#F5F3FA] tracking-tight">
            Discover & Add Friends
          </h2>
          <p className="text-xs text-[#A5A0B5] mt-0.5">
            Search by User ID, scan personal QR codes, or lookup phone contacts safely.
          </p>
        </div>

        {/* 3 Discovery Tabs */}
        <div className="flex p-1 rounded-2xl bg-[#1C1C23] border border-[#30303A] gap-1">
          <button
            type="button"
            onClick={() => setDiscoveryTab('userid')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              discoveryTab === 'userid'
                ? 'bg-[#202027] text-[#B45CFF] shadow-[-2px_-2px_6px_#30303A,2px_2px_6px_#101014] border border-[#B45CFF]/30'
                : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
            }`}
          >
            <AtSign className="w-3.5 h-3.5" />
            <span>Search by User ID</span>
          </button>

          <button
            type="button"
            onClick={() => setDiscoveryTab('qr')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              discoveryTab === 'qr'
                ? 'bg-[#202027] text-[#B45CFF] shadow-[-2px_-2px_6px_#30303A,2px_2px_6px_#101014] border border-[#B45CFF]/30'
                : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setDiscoveryTab('contacts')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              discoveryTab === 'contacts'
                ? 'bg-[#202027] text-[#B45CFF] shadow-[-2px_-2px_6px_#30303A,2px_2px_6px_#101014] border border-[#B45CFF]/30'
                : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone Contacts</span>
          </button>
        </div>

        {/* TAB 1: SEARCH BY USER ID */}
        {discoveryTab === 'userid' && (
          <div className="space-y-4">
            <NeomorphicCard className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A5A0B5] mb-1">
                  Search by User ID
                </label>
                <p className="text-xs text-[#A5A0B5]">
                  Enter an exact username (e.g. <code className="text-[#B45CFF]">@priya_k</code>) or a public user ID.
                </p>
              </div>

              <form onSubmit={handleSearchUserId} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#B45CFF]">@</span>
                    <input
                      type="text"
                      placeholder="Enter username or user ID..."
                      value={userIdInput}
                      onChange={(e) => {
                        setUserIdInput(e.target.value);
                        setSearchValidationError(null);
                      }}
                      className="w-full bg-[#1B1B22] text-[#F5F3FA] placeholder-[#7E7991] text-xs rounded-xl py-2.5 pl-8 pr-3 
                      border border-[#34313D] shadow-[inset_2px_2px_5px_#101014,inset_-2px_-2px_5px_#262630] focus:border-[#B45CFF] outline-none"
                    />
                  </div>

                  <NeomorphicButton
                    type="submit"
                    variant="primary"
                    isLoading={isSearchingUserId}
                    disabled={!userIdInput.trim()}
                    className="text-xs px-4 py-2 shrink-0"
                  >
                    Search
                  </NeomorphicButton>
                </div>

                {searchValidationError && (
                  <p className="text-[11px] text-[#FF6B81] flex items-center gap-1.5 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{searchValidationError}</span>
                  </p>
                )}
              </form>

              <div className="flex items-center gap-1.5 text-[11px] text-[#7E7991]">
                <Sparkles className="w-3.5 h-3.5 text-[#B45CFF] shrink-0" />
                <span>Private & secure: only public profile cards are displayed. Zero email or phone numbers exposed.</span>
              </div>
            </NeomorphicCard>

            {/* Search Results */}
            {hasSearchedUserId && (
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#A5A0B5]">
                  Search Results ({userIdResults.length})
                </h3>

                {userIdResults.length === 0 ? (
                  <NeomorphicCard className="p-6 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center text-[#A5A0B5]">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#F5F3FA]">
                      No user found matching "{userIdInput.trim()}"
                    </p>
                    <p className="text-[11px] text-[#A5A0B5] max-w-sm mx-auto">
                      Please verify the username or user ID. You can also connect via QR code or phone contacts.
                    </p>
                  </NeomorphicCard>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userIdResults.map((u) => {
                      const isSending = sendingRequestUserIds.has(u.userId);
                      const isProcessing = processingActionUserIds.has(u.userId);
                      const isSelf = u.userId === currentUserId || u.friendshipStatus === 'self';
                      const isFriend = confirmedFriends.some((f) => f.id === u.userId) || u.friendshipStatus === 'friends';
                      const incomingReq = pendingRequests.find((r) => r.otherUserId === u.userId && r.isIncoming);
                      const isPendingReceived = !isFriend && !isSelf && (Boolean(incomingReq) || u.friendshipStatus === 'pending_received');
                      const outgoingReq = pendingRequests.find((r) => r.otherUserId === u.userId && !r.isIncoming);
                      const isPendingSent = !isFriend && !isSelf && !isPendingReceived && (Boolean(outgoingReq) || u.friendshipStatus === 'pending_sent');

                      return (
                        <NeomorphicCard key={u.userId} className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={u.displayName} avatarUrl={u.avatarUrl || undefined} size="sm" isOnline={true} />
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-[#F5F3FA] truncate">
                                {u.displayName}
                              </p>
                              {u.username && (
                                <p className="text-[11px] text-[#B45CFF] font-semibold truncate">
                                  @{u.username}
                                </p>
                              )}
                              {u.bio && (
                                <p className="text-[10px] text-[#A5A0B5] truncate mt-0.5">
                                  {u.bio}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelf ? (
                              // State 5: Logged-in user viewing their own profile: Show no friend action.
                              null
                            ) : isFriend ? (
                              // State 4: Already friends: Show "Friends".
                              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#86EFAC]/15 text-[#86EFAC] font-semibold border border-[#86EFAC]/30">
                                Friends
                              </span>
                            ) : isPendingSent ? (
                              // State 2: A pending request sent by the logged-in user: Show "Request Sent".
                              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#B45CFF]/15 text-[#B45CFF] font-semibold border border-[#B45CFF]/30">
                                Request Sent
                              </span>
                            ) : isPendingReceived ? (
                              // State 3: A pending request received by the logged-in user: Show "Accept" and "Decline".
                              <div className="flex items-center gap-1.5">
                                <NeomorphicButton
                                  variant="primary"
                                  className="px-2.5 py-1 text-xs bg-[#86EFAC]/20 hover:bg-[#86EFAC]/30 text-[#86EFAC] border border-[#86EFAC]/40"
                                  isLoading={isProcessing}
                                  disabled={isProcessing}
                                  onClick={() => handleAcceptRequest(incomingReq?.id, u.userId)}
                                >
                                  Accept
                                </NeomorphicButton>
                                <NeomorphicButton
                                  variant="ghost"
                                  className="px-2.5 py-1 text-xs text-[#A5A0B5] hover:text-[#FF6B81] border border-white/5"
                                  isLoading={isProcessing}
                                  disabled={isProcessing}
                                  onClick={() => handleRejectRequest(incomingReq?.id, u.userId)}
                                >
                                  Decline
                                </NeomorphicButton>
                              </div>
                            ) : (
                              // State 1: No relationship: Show "Add Friend".
                              <NeomorphicButton
                                variant="primary"
                                className="px-3 py-1.5 text-xs"
                                isLoading={isSending}
                                disabled={isSending}
                                onClick={() => handleSendRequestToUser(u)}
                                icon={<UserPlus className="w-3.5 h-3.5" />}
                              >
                                Add Friend
                              </NeomorphicButton>
                            )}
                          </div>
                        </NeomorphicCard>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QR CODE DISCOVERY */}
        {discoveryTab === 'qr' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: My Personal QR Code */}
            <NeomorphicCard className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-[#B45CFF]/15 text-[#B45CFF] flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#F5F3FA]">My Personal QR Code</h3>
                <p className="text-xs text-[#A5A0B5]">
                  Display your unique BreakTym QR code or share your private invitation link.
                </p>
              </div>

              <NeomorphicButton
                variant="primary"
                onClick={() => setShowMyQRModal(true)}
                className="w-full text-xs py-2.5"
                icon={<QrCode className="w-3.5 h-3.5" />}
              >
                View My QR Code
              </NeomorphicButton>
            </NeomorphicCard>

            {/* Card 2: Scan or Upload a QR Code */}
            <NeomorphicCard className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-[#86EFAC]/15 text-[#86EFAC] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#F5F3FA]">Scan Friend's QR Code</h3>
                <p className="text-xs text-[#A5A0B5]">
                  Scan in person using your camera or upload a QR screenshot from your gallery.
                </p>
              </div>

              <NeomorphicButton
                variant="secondary"
                onClick={() => setShowScannerModal(true)}
                className="w-full text-xs py-2.5"
                icon={<Camera className="w-3.5 h-3.5 text-[#86EFAC]" />}
              >
                Open Camera / Upload QR
              </NeomorphicButton>
            </NeomorphicCard>
          </div>
        )}

        {/* TAB 3: CONTACT-BASED DISCOVERY */}
        {discoveryTab === 'contacts' && (
          <div className="space-y-4">
            {/* Notice if user has no phone linked */}
            {!hasLinkedPhone && onLinkPhoneClick && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-amber-300">
                  <Phone className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>You haven't linked a mobile number yet. Contacts who have your number in their phone won't be able to match you until it's linked.</span>
                </div>
                <button
                  onClick={onLinkPhoneClick}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold transition-all shrink-0 self-start sm:self-auto border border-amber-500/30"
                >
                  Link Mobile Number
                </button>
              </div>
            )}

            {/* Sync Contacts Action Card */}
            <NeomorphicCard className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F5F3FA] flex items-center gap-2">
                    <span>Sync Phone Contacts</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#86EFAC]/15 text-[#86EFAC] border border-[#86EFAC]/30 font-semibold">
                      Privacy Guaranteed
                    </span>
                  </h3>
                  <p className="text-xs text-[#A5A0B5] max-w-lg">
                    See who in your phone is already on BreakTym. Your contacts are never stored or exposed to anyone.
                  </p>
                </div>

                <NeomorphicButton
                  onClick={handleLaunchContactPicker}
                  isLoading={isMatchingContacts}
                  className="text-xs py-2.5 px-4 shrink-0"
                  icon={<UserPlus className="w-4 h-4" />}
                >
                  {isContactPickerSupported() ? 'Select Phone Contacts' : 'Sync Phone Contacts'}
                </NeomorphicButton>
              </div>

              {/* Desktop / Manual fallback row */}
              <div className="pt-3 border-t border-white/5">
                <p className="text-[11px] font-semibold text-[#A5A0B5] uppercase mb-2">
                  Or Lookup a Friend by Phone Number
                </p>
                <form onSubmit={handleManualAddPhone} className="flex flex-col sm:flex-row gap-2">
                  <NeomorphicInput
                    placeholder="Friend's Name (e.g. Sam)"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="text-xs py-2"
                  />
                  <NeomorphicInput
                    type="tel"
                    placeholder="Mobile number (+91...)"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="text-xs py-2"
                    required
                  />
                  <NeomorphicButton
                    type="submit"
                    variant="secondary"
                    isLoading={isMatchingContacts}
                    className="text-xs py-2 px-4 shrink-0"
                  >
                    Check Number
                  </NeomorphicButton>
                </form>
              </div>
            </NeomorphicCard>

            {/* Discovered Contacts Results */}
            {discoveredContacts.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#86EFAC]">
                  Matching Contacts ({discoveredContacts.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {discoveredContacts.map((item) => (
                    <NeomorphicCard key={item.contact.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={item.breakTymDisplayName || item.contact.displayName} size="sm" isOnline={true} />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[#F5F3FA] truncate">
                            {item.breakTymDisplayName || item.contact.displayName}
                          </p>
                          <p className="text-[10px] text-[#A5A0B5] truncate">
                            {item.contact.phoneNumbers[0]}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.isBreakTymUser ? (
                          item.friendshipStatus === 'friends' ? (
                            <span className="text-[11px] font-semibold text-[#86EFAC]">Friend ✓</span>
                          ) : item.friendshipStatus === 'pending_sent' ? (
                            <span className="text-[11px] font-semibold text-[#B45CFF]">Request Sent</span>
                          ) : (
                            <NeomorphicButton
                              variant="primary"
                              className="px-3 py-1.5 text-xs"
                              onClick={() =>
                                item.breakTymUserId &&
                                handleSendFriendRequestToContact(item.breakTymUserId, item.breakTymDisplayName || item.contact.displayName)
                              }
                            >
                              Add Friend
                            </NeomorphicButton>
                          )
                        ) : (
                          <button
                            onClick={() => setShowMyQRModal(true)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A5A0B5] hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            Share Invite QR
                          </button>
                        )}
                      </div>
                    </NeomorphicCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Modals */}
      {/* My QR Code Modal */}
      <MyQRCodeModal
        isOpen={showMyQRModal}
        onClose={() => setShowMyQRModal(false)}
        userProfile={userProfile || null}
        onTokenRegenerated={(newToken) => {
          if (userProfile && onProfileUpdated) {
            onProfileUpdated({ ...userProfile, qrToken: newToken });
          }
        }}
        isDemo={isDemo}
      />

      {/* QR Scanner Modal (Camera / Image upload / Paste) */}
      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Target Profile Resolution Modal */}
      <TargetProfileModal
        isOpen={Boolean(scannedQrToken)}
        onClose={() => setScannedQrToken(null)}
        qrToken={scannedQrToken}
        currentUserId={currentUserId}
        isDemo={isDemo}
        onRequestSent={onRefresh}
      />
    </div>
  );
};
