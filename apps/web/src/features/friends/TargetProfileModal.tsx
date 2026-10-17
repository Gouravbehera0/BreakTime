import React, { useState, useEffect } from 'react';
import { UserPlus, Check, AlertCircle, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { Avatar } from '@/components/ui/Avatar';
import { friendService } from '@/services/friend-service';
import { DiscoveredUserProfile } from '@/types/contact';

interface TargetProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrToken: string | null;
  currentUserId: string;
  isDemo?: boolean;
  onRequestSent?: () => void;
}

export const TargetProfileModal: React.FC<TargetProfileModalProps> = ({
  isOpen,
  onClose,
  qrToken,
  currentUserId,
  isDemo = false,
  onRequestSent,
}) => {
  const [profile, setProfile] = useState<DiscoveredUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !qrToken) {
      setProfile(null);
      setErrorNotice(null);
      setSuccessNotice(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorNotice(null);

    friendService
      .resolveProfileByQrToken(qrToken, currentUserId, isDemo)
      .then((res) => {
        if (!isMounted) return;
        setIsLoading(false);
        if (res) {
          setProfile(res);
        } else {
          setErrorNotice('This QR code or invitation link is invalid or has been revoked.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsLoading(false);
        setErrorNotice(err?.message || 'Failed to resolve profile from QR code.');
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, qrToken, currentUserId, isDemo]);

  const handleSendRequest = async () => {
    if (!profile) return;
    setIsSending(true);
    setErrorNotice(null);

    const res = await friendService.sendFriendRequest(
      currentUserId,
      profile.userId,
      profile.displayName,
      isDemo
    );
    setIsSending(false);

    if (res.success) {
      setSuccessNotice(`Friend request sent to ${profile.displayName}! ✨`);
      setProfile((prev) => (prev ? { ...prev, friendshipStatus: 'pending_sent' } : null));
      if (onRequestSent) onRequestSent();
    } else {
      setErrorNotice(res.error || 'Could not send friend request.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Friend Invitation"
      description="Connect and plan spontaneous breaks together."
      maxWidth="sm"
    >
      <div className="space-y-4 pt-2 text-center">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#B45CFF] border-t-transparent animate-spin" />
            <p className="text-xs text-[#A5A0B5]">Resolving profile securely...</p>
          </div>
        ) : errorNotice && !profile ? (
          <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-[#FF6B81] space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-[#FF6B81]" />
            <p className="font-semibold">{errorNotice}</p>
            <p className="text-[11px] text-[#A5A0B5]">
              Ask your friend to generate a fresh QR code from their BreakTym profile.
            </p>
          </div>
        ) : profile ? (
          <div className="space-y-5">
            {successNotice && (
              <div className="p-3 rounded-xl bg-[#86EFAC]/15 border border-[#86EFAC]/30 text-xs text-[#86EFAC] flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Profile Showcase Card */}
            <div className="p-5 rounded-2xl bg-[#1C1C23] border border-[#30303A] shadow-[-4px_-4px_10px_#30303A,6px_6px_14px_#101014] flex flex-col items-center space-y-3">
              <Avatar
                name={profile.displayName}
                avatarUrl={profile.avatarUrl || undefined}
                size="lg"
                isOnline={true}
              />

              <div>
                <h3 className="text-base font-bold text-[#F5F3FA]">
                  {profile.displayName}
                </h3>
                {profile.username && (
                  <p className="text-xs text-[#B45CFF] font-semibold mt-0.5">
                    @{profile.username}
                  </p>
                )}
                <p className="text-[10px] text-[#7E7991] font-mono mt-0.5 truncate max-w-[200px] mx-auto">
                  ID: {profile.userId}
                </p>
                {profile.bio && (
                  <p className="text-xs text-[#A5A0B5] mt-2 max-w-xs mx-auto italic">
                    "{profile.bio}"
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="pt-2">
                {profile.friendshipStatus === 'self' && (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-[#A5A0B5] text-xs font-semibold">
                    This is your own QR code
                  </span>
                )}
                {profile.friendshipStatus === 'friends' && (
                  <span className="px-3 py-1 rounded-full bg-[#86EFAC]/15 border border-[#86EFAC]/30 text-[#86EFAC] text-xs font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Already in your circle</span>
                  </span>
                )}
                {profile.friendshipStatus === 'pending_sent' && (
                  <span className="px-3 py-1 rounded-full bg-[#B45CFF]/15 border border-[#B45CFF]/30 text-[#B45CFF] text-xs font-semibold">
                    Friend Request Sent • Pending
                  </span>
                )}
                {profile.friendshipStatus === 'pending_received' && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>Sent you a friend request</span>
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {profile.friendshipStatus === 'none' && (
              <NeomorphicButton
                variant="primary"
                onClick={handleSendRequest}
                isLoading={isSending}
                className="w-full text-xs py-3"
                icon={<UserPlus className="w-4 h-4" />}
              >
                Send Friend Request
              </NeomorphicButton>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#7E7991]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#86EFAC] shrink-0" />
              <span>Contact privacy guaranteed: Phone numbers are never revealed.</span>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
