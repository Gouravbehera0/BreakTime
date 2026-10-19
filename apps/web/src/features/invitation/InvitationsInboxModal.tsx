import React, { useState } from 'react';
import {
  Inbox,
  Send,
  Check,
  X,
  Clock,
  Coffee,
  RotateCw,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { ActivityInvitation, MeetingStatus } from '@/types/invitation';

interface InvitationsInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitations: ActivityInvitation[];
  currentUserId: string;
  onAccept: (invitationId: string) => Promise<void>;
  onDecline: (invitationId: string) => Promise<void>;
  onUpdateMeetingStatus?: (invitationId: string, meetingStatus: MeetingStatus) => Promise<void>;
  isLoading?: boolean;
  onRefresh?: () => Promise<void> | void;
  onCelebrate?: (invitation: ActivityInvitation) => void;
}

export const InvitationsInboxModal: React.FC<InvitationsInboxModalProps> = ({
  isOpen,
  onClose,
  invitations,
  currentUserId,
  onAccept,
  onDecline,
  onUpdateMeetingStatus,
  isLoading = false,
  onRefresh,
  onCelebrate,
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter incoming invitations (where recipient is current user)
  const incomingInvitations = invitations.filter(
    (inv) => inv.recipientId === currentUserId
  );
  const pendingIncoming = incomingInvitations.filter(
    (inv) => inv.status === 'pending' || inv.status === 'sent'
  );

  // Filter sent invitations (where sender is current user)
  const sentInvitations = invitations.filter(
    (inv) => inv.senderId === currentUserId
  );

  const handleAction = async (id: string, action: 'accept' | 'decline') => {
    if (processingId) return;
    setProcessingId(id);
    try {
      if (action === 'accept') {
        await onAccept(id);
      } else {
        await onDecline(id);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const renderMeetingStatusBadge = (inv: ActivityInvitation) => {
    const ms = inv.meetingStatus || 'pending';
    if (ms === 'completed') {
      return (
        <span className="text-[10px] font-bold text-[#86EFAC] bg-[#86EFAC]/15 px-2.5 py-0.5 rounded-full border border-[#86EFAC]/30 flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span>Meeting Completed</span>
        </span>
      );
    }
    if (ms === 'cancelled') {
      return (
        <span className="text-[10px] font-semibold text-[#FF6B81] bg-[#FF6B81]/10 px-2.5 py-0.5 rounded-full border border-[#FF6B81]/20 flex items-center gap-1">
          <X className="w-3 h-3" />
          <span>Meeting Cancelled</span>
        </span>
      );
    }
    if (ms === 'missed') {
      return (
        <span className="text-[10px] font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/25 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Meeting Missed</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-[#B45CFF] bg-[#B45CFF]/15 px-2 py-0.5 rounded-full border border-[#B45CFF]/30 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        <span>Meeting Pending</span>
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Break Invitations"
      description="Spontaneous plans and invitations from your close circle."
      maxWidth="lg"
    >
      <div className="space-y-4 pt-1 text-left">
        {/* Tab Toggle: Incoming vs Sent */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex p-1 rounded-xl bg-[#17171C] border border-[#30303A] gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'incoming'
                  ? 'bg-[#202027] text-[#B45CFF] shadow-[-2px_-2px_6px_#30303A,2px_2px_6px_#101014] border border-[#B45CFF]/40'
                  : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Incoming</span>
              {pendingIncoming.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#B45CFF] text-white text-[10px] font-bold shadow-[0_0_8px_#B45CFF]">
                  {pendingIncoming.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sent')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sent'
                  ? 'bg-[#202027] text-[#B45CFF] shadow-[-2px_-2px_6px_#30303A,2px_2px_6px_#101014] border border-[#B45CFF]/40'
                  : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sent History</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-[#A5A0B5] font-bold">
                {sentInvitations.length}
              </span>
            </button>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              className="p-2.5 rounded-xl bg-[#202027] border border-[#30303A] text-[#A5A0B5] hover:text-[#F5F3FA] transition-all"
              title="Refresh invitations"
              disabled={isLoading}
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#B45CFF]' : ''}`} />
            </button>
          )}
        </div>

        {/* Tab 1: Incoming Invitations */}
        {activeTab === 'incoming' && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {incomingInvitations.length === 0 ? (
              <NeomorphicCard className="p-8 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#B45CFF]/10 text-[#B45CFF] flex items-center justify-center">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#F5F3FA]">No incoming invitations</h3>
                <p className="text-xs text-[#A5A0B5] max-w-sm mx-auto">
                  When your friends invite you for Chai, Night Rides, or spontaneous breaks, they will appear here in real-time.
                </p>
              </NeomorphicCard>
            ) : (
              incomingInvitations.map((inv) => {
                const isPending = inv.status === 'pending' || inv.status === 'sent';
                const isAccepted = inv.status === 'accepted';
                const isRejected = inv.status === 'rejected' || inv.status === 'declined';
                const isBusy = processingId === inv.id;

                return (
                  <div
                    key={inv.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-[#1C1C23] border-[#B45CFF]/35 shadow-[0_0_16px_rgba(180,92,255,0.12)]'
                        : 'bg-[#17171C] border-[#30303A]/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar
                          name={inv.senderDisplayName || 'Friend'}
                          avatarUrl={inv.senderAvatarUrl}
                          size="md"
                          isOnline={true}
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#F5F3FA]">
                              {inv.senderDisplayName || 'Friend'}
                            </span>
                            {inv.senderUsername && (
                              <span className="text-[11px] text-[#B45CFF] font-medium">
                                @{inv.senderUsername}
                              </span>
                            )}
                            <span className="text-[10px] text-[#7E7991]">
                              • {formatTime(inv.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B45CFF] bg-[#B45CFF]/15 px-2 py-0.5 rounded-full border border-[#B45CFF]/30">
                              NEW INVITATION
                            </span>
                            <span className="text-xs sm:text-sm font-black text-[#F5F3FA]">
                              {inv.activityTitle.toUpperCase()}
                            </span>
                          </div>

                          {inv.customNote && (
                            <p className="text-xs italic text-[#A5A0B5] bg-black/20 p-2 rounded-xl border border-white/5 mt-1">
                              "{inv.customNote}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0 text-right">
                        {isAccepted && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold text-[#86EFAC] bg-[#86EFAC]/15 px-2.5 py-0.5 rounded-full border border-[#86EFAC]/30 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Accepted</span>
                            </span>
                            {renderMeetingStatusBadge(inv)}
                            {inv.meetingStatus === 'pending' && onUpdateMeetingStatus && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => onUpdateMeetingStatus(inv.id, 'completed')}
                                  className="text-[10px] text-[#86EFAC] hover:underline font-semibold"
                                >
                                  Complete
                                </button>
                                <span className="text-[9px] text-[#7E7991]">•</span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateMeetingStatus(inv.id, 'cancelled')}
                                  className="text-[10px] text-[#FF6B81] hover:underline font-semibold"
                                >
                                  Cancel Meet
                                </button>
                              </div>
                            )}
                            {onCelebrate && (
                              <button
                                type="button"
                                onClick={() => onCelebrate(inv)}
                                className="text-[10px] text-[#B45CFF] hover:underline font-semibold mt-0.5 flex items-center gap-0.5"
                              >
                                <span>Celebration</span>
                                <span>✨</span>
                              </button>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <span className="text-[11px] font-semibold text-[#A5A0B5] bg-white/5 px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            <span>Declined</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25 flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions if Pending */}
                    {isPending && (
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5 mt-3">
                        <NeomorphicButton
                          variant="ghost"
                          className="px-3 py-1.5 text-xs text-[#A5A0B5] hover:text-[#FF6B81] border border-white/5"
                          isLoading={isBusy}
                          disabled={isBusy}
                          onClick={() => handleAction(inv.id, 'decline')}
                        >
                          Decline
                        </NeomorphicButton>
                        <NeomorphicButton
                          variant="primary"
                          className="px-4 py-1.5 text-xs bg-[#86EFAC]/20 hover:bg-[#86EFAC]/30 text-[#86EFAC] border border-[#86EFAC]/40 shadow-[0_0_12px_rgba(134,239,172,0.2)]"
                          isLoading={isBusy}
                          disabled={isBusy}
                          onClick={() => handleAction(inv.id, 'accept')}
                        >
                          Accept
                        </NeomorphicButton>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Sent Invitations History */}
        {activeTab === 'sent' && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {sentInvitations.length === 0 ? (
              <NeomorphicCard className="p-8 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/5 text-[#A5A0B5] flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#F5F3FA]">No sent invitations</h3>
                <p className="text-xs text-[#A5A0B5] max-w-sm mx-auto">
                  Invitations you dispatch to your friends will appear here with their live response status.
                </p>
              </NeomorphicCard>
            ) : (
              sentInvitations.map((inv) => {
                const isAccepted = inv.status === 'accepted';
                const isRejected = inv.status === 'rejected' || inv.status === 'declined';
                const isPending = inv.status === 'pending' || inv.status === 'sent';

                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-[#1B1B22] border border-[#30303A]/70 flex items-center justify-between gap-3 shadow-[-2px_-2px_6px_#282833,2px_2px_6px_#101014]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={inv.recipientDisplayName || 'Friend'}
                        avatarUrl={inv.recipientAvatarUrl}
                        size="md"
                        isOnline={true}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-[#F5F3FA] truncate">
                            {inv.recipientDisplayName || 'Friend'}
                          </p>
                          {inv.recipientUsername && (
                            <span className="text-[11px] text-[#B45CFF]">
                              @{inv.recipientUsername}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-[#B45CFF]">
                          {inv.activityTitle}
                        </p>
                        {inv.customNote && (
                          <p className="text-[11px] italic text-[#7E7991] truncate max-w-xs">
                            "{inv.customNote}"
                          </p>
                        )}
                        <p className="text-[10px] text-[#7E7991]">
                          Sent {formatTime(inv.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isAccepted && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-[#86EFAC] bg-[#86EFAC]/15 px-2.5 py-0.5 rounded-full border border-[#86EFAC]/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Accepted</span>
                          </span>
                          {renderMeetingStatusBadge(inv)}
                          {inv.meetingStatus === 'pending' && onUpdateMeetingStatus && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <button
                                type="button"
                                onClick={() => onUpdateMeetingStatus(inv.id, 'completed')}
                                className="text-[10px] text-[#86EFAC] hover:underline font-semibold"
                              >
                                Complete
                              </button>
                              <span className="text-[9px] text-[#7E7991]">•</span>
                              <button
                                type="button"
                                onClick={() => onUpdateMeetingStatus(inv.id, 'cancelled')}
                                className="text-[10px] text-[#FF6B81] hover:underline font-semibold"
                              >
                                Cancel Meet
                              </button>
                            </div>
                          )}
                          {onCelebrate && (
                            <button
                              type="button"
                              onClick={() => onCelebrate(inv)}
                              className="text-[10px] text-[#B45CFF] hover:underline font-semibold mt-0.5 flex items-center gap-0.5"
                            >
                              <span>Celebration</span>
                              <span>✨</span>
                            </button>
                          )}
                        </div>
                      )}
                      {isRejected && (
                        <span className="text-[11px] font-semibold text-[#A5A0B5] bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                          Declined
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25">
                          Pending Response
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
