import React, { useState } from 'react';
import {
  Users,
  Search,
  Check,
  X,
  UserPlus,
  Share2,
  QrCode,
  Copy,
  Phone,
} from 'lucide-react';
import { Contact, FriendRequest, DiscoveredContact, ContactPerson } from '@/types/contact';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { NeomorphicInput } from '@/components/ui/NeomorphicInput';
import { Avatar } from '@/components/ui/Avatar';
import { RelationshipBadge } from '@/components/ui/RelationshipBadge';
import { Modal } from '@/components/ui/Modal';
import {
  isContactPickerSupported,
  pickPhoneContacts,
  normalizePhoneNumber,
  generateInviteLink,
} from '@/lib/contact-picker';
import { friendService } from '@/services/friend-service';

interface FriendsViewProps {
  currentUserId: string;
  confirmedFriends: Contact[];
  pendingRequests: FriendRequest[];
  onRefresh: () => void;
  onInviteToBreak: (contact: Contact) => void;
  userName?: string;
  isDemo?: boolean;
  hasLinkedPhone?: boolean;
  onLinkPhoneClick?: () => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  currentUserId,
  confirmedFriends,
  pendingRequests,
  onRefresh,
  onInviteToBreak,
  userName = 'You',
  isDemo = false,
  hasLinkedPhone = true,
  onLinkPhoneClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [discoveredUsers, setDiscoveredUsers] = useState<DiscoveredContact[]>([]);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const inviteLink = generateInviteLink(userName);

  // Filter confirmed friends
  const filteredFriends = confirmedFriends.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.relationship.toLowerCase().includes(q) ||
      f.phoneNumber?.includes(q)
    );
  });

  // Handle browser Contact Picker API
  const handleLaunchContactPicker = async () => {
    setIsMatching(true);
    setNotice(null);

    const result = await pickPhoneContacts();
    if (!result.supported) {
      setIsMatching(false);
      setNotice('Contact Picker API is not supported in this desktop browser. You can enter phone numbers directly below or share your BreakTym invite link.');
      return;
    }

    if (result.error) {
      setIsMatching(false);
      setNotice(result.error);
      return;
    }

    if (result.contacts.length === 0) {
      setIsMatching(false);
      setNotice('No contacts were selected.');
      return;
    }

    // Match selected contacts
    const matched = await friendService.matchPhoneContacts(
      result.contacts,
      currentUserId,
      isDemo
    );
    setIsMatching(false);
    setDiscoveredUsers(matched);
  };

  // Handle manual single contact lookup
  const handleManualAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone.trim()) return;

    setIsMatching(true);
    setNotice(null);

    const normalized = normalizePhoneNumber(manualPhone);
    const mockPerson: ContactPerson = {
      id: `manual_${Date.now()}`,
      displayName: manualName.trim() || 'Contact',
      phoneNumbers: [normalized],
    };

    const matched = await friendService.matchPhoneContacts(
      [mockPerson],
      currentUserId,
      isDemo
    );

    setIsMatching(false);
    setDiscoveredUsers((prev) => [...matched, ...prev.filter((p) => p.contact.phoneNumbers[0] !== normalized)]);
    setManualPhone('');
    setManualName('');
  };

  const handleSendFriendRequest = async (recipientId: string, recipientName: string) => {
    const res = await friendService.sendFriendRequest(currentUserId, recipientId, recipientName, isDemo);
    if (res.success) {
      setDiscoveredUsers((prev) =>
        prev.map((d) =>
          d.breakTymUserId === recipientId
            ? { ...d, friendshipStatus: 'pending_sent' }
            : d
        )
      );
      setNotice(`Friend request sent to ${recipientName}!`);
      onRefresh();
    } else {
      setNotice(res.error || 'Failed to send request.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const res = await friendService.acceptFriendRequest(requestId, currentUserId, isDemo);
    if (res.success) {
      setNotice('Friend request accepted! Added to your circle.');
      onRefresh();
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const res = await friendService.declineFriendRequest(requestId, currentUserId, isDemo);
    if (res.success) {
      setNotice('Request declined.');
      onRefresh();
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const res = await friendService.cancelFriendRequest(requestId, currentUserId, isDemo);
    if (res.success) {
      setNotice('Request cancelled.');
      onRefresh();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-7 text-left">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FA] tracking-tight">
            Your Circles & Friends
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A0B5] mt-0.5">
            Privacy-first friend discovery strictly via verified phone contacts.
          </p>
        </div>

        <button
          onClick={() => setShowShareModal(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl 
          bg-[#202027] hover:bg-[#282833] border border-[#B45CFF]/30 text-xs font-semibold text-[#F5F3FA] 
          shadow-[-2px_-2px_6px_#30303A,3px_3px_8px_#101014] hover:shadow-[0_0_12px_rgba(180,92,255,0.25)] transition-all"
        >
          <Share2 className="w-3.5 h-3.5 text-[#B45CFF]" />
          <span>Invite Link & QR</span>
        </button>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-[#B45CFF]/10 border border-[#B45CFF]/30 text-xs text-[#F5F3FA] flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[#A5A0B5] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Pending Requests Section (If any) */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#B45CFF]">
              Pending Requests
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#B45CFF]/20 text-[#B45CFF] text-[10px] font-bold">
              {pendingRequests.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <NeomorphicCard key={req.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={req.otherUserName} size="sm" isOnline={true} />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#F5F3FA] truncate">
                      {req.otherUserName}
                    </p>
                    <p className="text-[10px] text-[#A5A0B5]">
                      {req.isIncoming ? 'Wants to be in your circle' : 'Request sent • Pending'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {req.isIncoming ? (
                    <>
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="p-1.5 rounded-lg bg-[#86EFAC]/15 hover:bg-[#86EFAC]/25 text-[#86EFAC] border border-[#86EFAC]/30 transition-colors"
                        title="Accept request"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req.id)}
                        className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-[#FF6B81] border border-red-500/30 transition-colors"
                        title="Decline request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#A5A0B5] hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>
      )}

      {/* 3. Confirmed Friends Section */}
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
                className="w-full bg-[#1B1B22] text-[#F5F3FA] placeholder-[#635E74] text-xs rounded-lg py-1.5 pl-8 pr-3 
                border border-[#34313D] focus:border-[#9E65FF] outline-none"
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
              {searchQuery ? `No friends matching "${searchQuery}"` : 'No confirmed friends yet'}
            </p>
            <p className="text-[11px] text-[#A5A0B5] max-w-sm mx-auto">
              Find contacts below or share your personal BreakTym invite link.
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

      {/* 4. Find Friends from Contacts Section */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#A5A0B5]">
            Find Friends from Contacts
          </h2>
          <p className="text-xs text-[#A5A0B5] mt-0.5">
            Zero usernames. Zero random discovery. Only people saved in your phone.
          </p>
        </div>

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
              isLoading={isMatching}
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
                isLoading={isMatching}
                className="text-xs py-2 px-4 shrink-0"
              >
                Check Number
              </NeomorphicButton>
            </form>
          </div>
        </NeomorphicCard>

        {/* Discovered Contacts Results */}
        {discoveredUsers.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#86EFAC]">
              Matching Results ({discoveredUsers.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {discoveredUsers.map((item) => (
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
                            handleSendFriendRequest(item.breakTymUserId, item.breakTymDisplayName || item.contact.displayName)
                          }
                        >
                          Add Friend
                        </NeomorphicButton>
                      )
                    ) : (
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A5A0B5] hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        Invite to Tym
                      </button>
                    )}
                  </div>
                </NeomorphicCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share / QR Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Invite Your People"
        description="Share your invite link or let friends scan your QR code to connect on BreakTym."
      >
        <div className="space-y-5 text-center pt-2">
          {/* Mock QR Representation */}
          <div className="w-44 h-44 mx-auto p-3 rounded-2xl bg-white flex flex-col items-center justify-center shadow-lg">
            <QrCode className="w-36 h-36 text-black" />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#F5F3FA]">{userName}'s BreakTym Link</p>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#1B1B22] border border-[#34313D] text-xs text-[#A5A0B5]">
              <span className="truncate flex-1 text-left">{inviteLink}</span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-[#B45CFF]/20 text-[#B45CFF] hover:bg-[#B45CFF]/30 transition-colors"
                title="Copy link"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-[#86EFAC]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <NeomorphicButton
            variant="primary"
            className="w-full text-xs"
            onClick={handleCopyLink}
            icon={linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {linkCopied ? 'Link Copied to Clipboard!' : 'Copy Shareable Link'}
          </NeomorphicButton>
        </div>
      </Modal>
    </div>
  );
};
