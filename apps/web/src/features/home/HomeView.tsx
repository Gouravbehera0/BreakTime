import React, { useState, useMemo } from 'react';
import { Search, Pin, Send, Plus, Sparkles, Coffee, Bike, Utensils, ShoppingBag, Phone } from 'lucide-react';
import { Contact, ContactFilter } from '@/types/contact';
import { ActivityInvitation } from '@/types/invitation';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { RelationshipBadge } from '@/components/ui/RelationshipBadge';
import { Avatar } from '@/components/ui/Avatar';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { TypewriterHeadline } from './TypewriterHeadline';

interface HomeViewProps {
  userName?: string;
  contacts: Contact[];
  isLoading: boolean;
  onSelectContactForInvite: (contact: Contact) => void;
  onInstantInvite: (contact: Contact) => void;
  onTogglePin: (contactId: string) => void;
  onNavigateToFriends: () => void;
  onQuickActivityClick: (activityId: string) => void;
  invitingContactIds?: Set<string>;
  invitedContactIds?: Set<string>;
  hasLinkedPhone?: boolean;
  onLinkPhoneClick?: () => void;
  incomingInvitations?: ActivityInvitation[];
  onAcceptInvitation?: (invitationId: string) => Promise<void>;
  onDeclineInvitation?: (invitationId: string) => Promise<void>;
  onOpenInbox?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userName = 'Friend',
  contacts,
  isLoading,
  onSelectContactForInvite,
  onInstantInvite,
  onTogglePin,
  onNavigateToFriends,
  onQuickActivityClick,
  invitingContactIds = new Set(),
  invitedContactIds = new Set(),
  hasLinkedPhone = true,
  onLinkPhoneClick,
  incomingInvitations = [],
  onAcceptInvitation,
  onDeclineInvitation,
  onOpenInbox,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ContactFilter>('ALL');

  // Compute live counts
  const counts = useMemo(() => {
    return {
      all: contacts.length,
      online: contacts.filter((c) => c.isOnline).length,
      offline: contacts.filter((c) => !c.isOnline).length,
      pinned: contacts.filter((c) => c.isPinned).length,
    };
  }, [contacts]);

  // Filtered contacts
  const displayedContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = contact.name.toLowerCase().includes(q);
          const matchNickname = contact.privateNickname?.toLowerCase().includes(q);
          const matchRel = contact.relationship.toLowerCase().includes(q);
          if (!matchName && !matchNickname && !matchRel) return false;
        }

        // Selected filter
        if (selectedFilter === 'ONLINE') return contact.isOnline;
        if (selectedFilter === 'OFFLINE') return !contact.isOnline;
        if (selectedFilter === 'PINNED') return contact.isPinned;
        return true;
      })
      .sort((a, b) => {
        // Pinned contacts first
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        // Then online contacts
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [contacts, searchQuery, selectedFilter]);

  const quickPicks = [
    { id: 'act_chai', title: 'Chai', icon: Coffee, emoji: '☕' },
    { id: 'act_night_ride', title: 'Night Ride', icon: Bike, emoji: '🏍️' },
    { id: 'act_food', title: 'Food', icon: Utensils, emoji: '🍜' },
    { id: 'act_shopping', title: 'Shopping', icon: ShoppingBag, emoji: '🛍️' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-6">
      {/* 1. Hero Greeting Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="min-w-0 flex-1">
          <TypewriterHeadline userName={userName} />
        </div>

        {/* Add people button */}
        <button
          onClick={onNavigateToFriends}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl 
          bg-[#202027] hover:bg-[#282833] border border-[#B45CFF]/30 text-xs font-semibold text-[#F5F3FA] 
          shadow-[-2px_-2px_6px_#30303A,3px_3px_8px_#101014] hover:shadow-[0_0_14px_rgba(180,92,255,0.25)] transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-[#B45CFF]" />
          <span>Find Friends</span>
        </button>
      </div>

      {/* Phone Link Prompt Banner (if not yet linked) */}
      {!hasLinkedPhone && onLinkPhoneClick && (
        <NeomorphicCard className="p-4 bg-[#202027] border border-[#B45CFF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B45CFF]/15 border border-[#B45CFF]/30 flex items-center justify-center text-[#B45CFF] shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F5F3FA]">
                Link Your Mobile Phone
              </p>
              <p className="text-[11px] text-[#A5A0B5]">
                Enable friends who have your number in their phone to discover you on BreakTym.
              </p>
            </div>
          </div>

          <NeomorphicButton
            variant="primary"
            onClick={onLinkPhoneClick}
            className="text-xs py-2 px-3.5 self-start sm:self-auto shrink-0"
          >
            Link Phone Number
          </NeomorphicButton>
        </NeomorphicCard>
      )}

      {/* Incoming Break Invitations Section */}
      {incomingInvitations.length > 0 && (
        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B45CFF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Incoming Break Invitations ({incomingInvitations.length})
            </span>
            {onOpenInbox && (
              <button
                onClick={onOpenInbox}
                className="text-[11px] font-semibold text-[#A5A0B5] hover:text-[#B45CFF] transition-colors"
              >
                View Inbox →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incomingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#1C1C23] border border-[#B45CFF]/40 shadow-[0_4px_25px_rgba(180,92,255,0.18)] flex flex-col justify-between space-y-3 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={inv.senderDisplayName || 'Friend'}
                        avatarUrl={inv.senderAvatarUrl}
                        size="sm"
                        isOnline={true}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#F5F3FA] truncate">
                          {inv.senderDisplayName || 'Friend'}
                        </p>
                        {inv.senderUsername && (
                          <p className="text-[10px] text-[#B45CFF] font-medium truncate">
                            @{inv.senderUsername}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#B45CFF] bg-[#B45CFF]/15 px-2 py-0.5 rounded-full border border-[#B45CFF]/30">
                      NEW INVITATION
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#F5F3FA]">
                      {inv.senderDisplayName || 'Friend'} invited you for {inv.activityTitle.toUpperCase()}
                    </h3>
                    {inv.customNote && (
                      <p className="text-xs italic text-[#A5A0B5] mt-1 bg-black/20 p-2 rounded-xl border border-white/5">
                        "{inv.customNote}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <NeomorphicButton
                    variant="ghost"
                    onClick={() => onDeclineInvitation && onDeclineInvitation(inv.id)}
                    className="flex-1 py-1.5 text-xs text-[#A5A0B5] hover:text-[#FF6B81] border border-white/5"
                  >
                    Decline
                  </NeomorphicButton>
                  <NeomorphicButton
                    variant="primary"
                    onClick={() => onAcceptInvitation && onAcceptInvitation(inv.id)}
                    className="flex-1 py-1.5 text-xs bg-[#86EFAC]/20 hover:bg-[#86EFAC]/30 text-[#86EFAC] border border-[#86EFAC]/40 shadow-[0_0_12px_rgba(134,239,172,0.25)]"
                  >
                    Accept
                  </NeomorphicButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Quick Activity Prompts */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#A5A0B5] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#B45CFF]" />
          <span>Quick Plan Ideas</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickPicks.map((item) => (
            <button
              key={item.id}
              onClick={() => onQuickActivityClick(item.id)}
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-[#202027] to-[#1A1A21] 
              border border-[#30303A]/50 shadow-[-2px_-2px_6px_#30303A,3px_3px_8px_#101014] hover:border-[#B45CFF]/40 
              hover:-translate-y-0.5 transition-all text-left group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{item.emoji}</span>
              <div>
                <p className="text-xs font-bold text-[#F5F3FA]">{item.title}</p>
                <p className="text-[10px] text-[#A5A0B5]">Tap to invite</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5A0B5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your circle by name or relationship..."
            className="w-full bg-[#1B1B22] text-[#F5F3FA] placeholder-[#7E7991] text-xs sm:text-sm rounded-xl py-3 pl-10 pr-4 
            border border-[#34313D] shadow-[inset_2px_2px_5px_#101014,inset_-2px_-2px_5px_#262630] focus:border-[#B45CFF] outline-none transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: 'ALL', label: 'All', count: counts.all },
              { id: 'ONLINE', label: 'Online', count: counts.online },
              { id: 'PINNED', label: 'Pinned', count: counts.pinned },
              { id: 'OFFLINE', label: 'Offline', count: counts.offline },
            ] as const
          ).map((filter) => {
            const isSelected = selectedFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#B45CFF] text-white shadow-[0_0_12px_rgba(180,92,255,0.4)]'
                    : 'bg-[#202027] text-[#A5A0B5] hover:text-[#F5F3FA] border border-[#30303A]/60'
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-black/40 text-[#F5F3FA]'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. "YOUR PEOPLE" Contact Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#A5A0B5]">
            Your People ({displayedContacts.length})
          </h2>
          {contacts.length === 0 && !isLoading && (
            <span className="text-xs text-[#B45CFF] font-medium">Ready for your circle</span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && contacts.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#B45CFF] border-t-transparent animate-spin" />
            <p className="text-xs text-[#A5A0B5]">Connecting to your people...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayedContacts.length === 0 && (
          <NeomorphicCard className="p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#B45CFF]/10 flex items-center justify-center text-[#B45CFF] text-xl">
              👥
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F3FA]">
                {searchQuery ? `No one matches "${searchQuery}"` : 'No contacts in this list'}
              </h3>
              <p className="text-xs text-[#A5A0B5] mt-1 max-w-sm mx-auto">
                {contacts.length === 0
                  ? 'Connect with people from your contacts to make spontaneous plans.'
                  : 'Try selecting a different filter above.'}
              </p>
            </div>
            {contacts.length === 0 && (
              <NeomorphicButton onClick={onNavigateToFriends} className="mx-auto text-xs py-2 px-4">
                Sync Contacts to Find Friends
              </NeomorphicButton>
            )}
          </NeomorphicCard>
        )}

        {/* Contacts Grid / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedContacts.map((contact) => {
            const isInviting = invitingContactIds.has(contact.id);
            const isInvited = invitedContactIds.has(contact.id);

            return (
              <NeomorphicCard
                key={contact.id}
                interactive={true}
                className="p-4 flex items-center justify-between gap-3 group"
                onClick={() => onSelectContactForInvite(contact)}
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar
                    name={contact.name}
                    avatarUrl={contact.avatarUrl}
                    size="md"
                    isOnline={contact.isOnline}
                    showStatus={true}
                  />

                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#F5F3FA] truncate">
                        {contact.privateNickname || contact.name}
                      </h3>
                      {contact.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-[#B45CFF] fill-[#B45CFF] shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <RelationshipBadge relationship={contact.relationship} />
                      <span className="text-[11px] text-[#A5A0B5] truncate">
                        {contact.statusText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Pin button */}
                  <button
                    onClick={() => onTogglePin(contact.id)}
                    className={`p-2 rounded-xl transition-all ${
                      contact.isPinned
                        ? 'text-[#B45CFF] bg-[#B45CFF]/10'
                        : 'text-[#A5A0B5] hover:text-[#F5F3FA] hover:bg-white/5'
                    }`}
                    title={contact.isPinned ? 'Unpin contact' : 'Pin to top'}
                    aria-label="Toggle pin"
                  >
                    <Pin className={`w-4 h-4 ${contact.isPinned ? 'fill-current' : ''}`} />
                  </button>

                  {/* Instant Invite Button */}
                  <button
                    onClick={() => onInstantInvite(contact)}
                    disabled={isInviting || isInvited}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isInvited
                        ? 'bg-[#86EFAC]/15 text-[#86EFAC] border border-[#86EFAC]/30'
                        : 'bg-gradient-to-r from-[#8B5CF6] to-[#B45CFF] text-white shadow-[0_2px_10px_rgba(180,92,255,0.35)] hover:shadow-[0_4px_16px_rgba(180,92,255,0.5)] active:translate-y-0.5'
                    }`}
                  >
                    {isInviting ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : isInvited ? (
                      <span>Invited ✓</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Invite</span>
                      </>
                    )}
                  </button>
                </div>
              </NeomorphicCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
