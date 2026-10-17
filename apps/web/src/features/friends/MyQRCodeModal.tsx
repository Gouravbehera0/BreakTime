import React, { useState, useEffect } from 'react';
import { Copy, Share2, RefreshCw, Check, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { generateQRCodeDataUrl, generateProfileQRUrl } from '@/lib/qr-code';
import { friendService } from '@/services/friend-service';
import { UserProfile } from '@/types/auth';

interface MyQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onTokenRegenerated?: (newToken: string) => void;
  isDemo?: boolean;
}

export const MyQRCodeModal: React.FC<MyQRCodeModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onTokenRegenerated,
  isDemo = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const qrToken = userProfile?.qrToken || `token_${userProfile?.id?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'demo'}`;
  const inviteUrl = generateProfileQRUrl(qrToken);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    generateQRCodeDataUrl(inviteUrl).then((url) => {
      if (isMounted) setQrDataUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, inviteUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setNotice('Invitation link copied to clipboard!');
    setTimeout(() => {
      setIsCopied(false);
      setNotice(null);
    }, 2500);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Connect with ${userProfile?.displayName || 'me'} on BreakTym`,
          text: `Pause the World. Live the Moment. Scan or tap to connect with ${userProfile?.displayName || 'me'} on BreakTym!`,
          url: inviteUrl,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          handleCopyLink();
        }
        return;
      }
    }
    handleCopyLink();
  };

  const handleRevoke = async () => {
    if (!userProfile?.id) return;
    setIsRevoking(true);
    setNotice(null);

    const newToken = await friendService.regenerateQrToken(userProfile.id, isDemo);
    setIsRevoking(false);
    setShowConfirmRevoke(false);

    if (onTokenRegenerated) {
      onTokenRegenerated(newToken);
    }

    const newUrl = generateProfileQRUrl(newToken);
    const newQr = await generateQRCodeDataUrl(newUrl);
    setQrDataUrl(newQr);

    setNotice('QR code revoked and successfully refreshed! Old links are now invalid. ✨');
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Personal QR Code"
      description="Scan or share to connect with friends without revealing your phone number."
      maxWidth="md"
    >
      <div className="space-y-5 pt-2 text-center">
        {notice && (
          <div className="p-3 rounded-xl bg-[#B45CFF]/15 border border-[#B45CFF]/30 text-xs text-[#F5F3FA] flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-[#86EFAC]" />
            <span>{notice}</span>
          </div>
        )}

        {/* QR Code Container with Midnight Neomorphism Frame */}
        <div className="flex flex-col items-center justify-center">
          <div className="p-4 rounded-3xl bg-[#1C1C23] border border-[#30303A] shadow-[-6px_-6px_14px_#30303A,8px_8px_20px_#101014] relative group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Personal BreakTym QR Code"
                className="w-56 h-56 rounded-2xl object-contain drop-shadow-[0_0_16px_rgba(180,92,255,0.25)] select-none"
              />
            ) : (
              <div className="w-56 h-56 rounded-2xl flex flex-col items-center justify-center space-y-2 bg-[#17171C]">
                <div className="w-8 h-8 rounded-full border-2 border-[#B45CFF] border-t-transparent animate-spin" />
                <span className="text-[11px] text-[#A5A0B5]">Generating QR...</span>
              </div>
            )}
          </div>

          {/* User Tag Pill */}
          <div className="mt-3.5 flex flex-col items-center">
            <p className="text-sm font-bold text-[#F5F3FA]">
              {userProfile?.displayName || 'BreakTym User'}
            </p>
            {userProfile?.username && (
              <p className="text-xs text-[#B45CFF] font-semibold mt-0.5">
                @{userProfile.username}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <NeomorphicButton
            variant="primary"
            onClick={handleShare}
            className="text-xs py-2.5"
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            Share QR
          </NeomorphicButton>

          <NeomorphicButton
            variant="ghost"
            onClick={handleCopyLink}
            className="text-xs py-2.5"
            icon={isCopied ? <Check className="w-3.5 h-3.5 text-[#86EFAC]" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {isCopied ? 'Copied!' : 'Copy Link'}
          </NeomorphicButton>
        </div>

        {/* Revocation Section */}
        <div className="pt-3 border-t border-white/5 flex flex-col items-center gap-2">
          {showConfirmRevoke ? (
            <div className="w-full p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-left space-y-2.5">
              <p className="text-xs text-[#FF6B81] font-semibold">
                Revoke this QR code?
              </p>
              <p className="text-[11px] text-[#A5A0B5]">
                Anyone scanning your previous QR code or link will no longer be able to find your profile.
              </p>
              <div className="flex gap-2 pt-1">
                <NeomorphicButton
                  variant="danger"
                  onClick={handleRevoke}
                  isLoading={isRevoking}
                  className="flex-1 text-xs py-2"
                >
                  Confirm Revoke
                </NeomorphicButton>
                <button
                  type="button"
                  onClick={() => setShowConfirmRevoke(false)}
                  className="px-3 py-2 rounded-xl text-xs text-[#A5A0B5] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmRevoke(true)}
              className="text-xs text-[#A5A0B5] hover:text-[#FF6B81] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Revoke & Reset QR Code</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-[#7E7991] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#86EFAC] shrink-0" />
            <span>Safe & Private: Does not reveal phone number or email.</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
