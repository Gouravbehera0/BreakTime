import React, { useState } from 'react';
import { Bell, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { subscribeToPush, PushPermissionStatus } from '@/lib/push-notifications';

interface NotificationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isDemo?: boolean;
  onSuccess?: () => void;
}

export const NotificationPromptModal: React.FC<NotificationPromptModalProps> = ({
  isOpen,
  onClose,
  userId,
  isDemo = false,
  onSuccess,
}) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PushPermissionStatus | null>(null);

  const handleEnableNotifications = async () => {
    setIsSubscribing(true);
    setErrorMessage(null);

    try {
      const result = await subscribeToPush(userId, isDemo);
      setPermissionState(result.permission);

      if (result.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(result.error || 'Permission was not granted.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to enable notifications.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleMaybeLater = () => {
    // Cooldown: 3 days before showing prompt again
    const cooldownMs = 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('breaktym_push_prompt_dismissed_until', String(Date.now() + cooldownMs));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleMaybeLater} maxWidth="md">
      <div className="flex flex-col items-center text-center space-y-5 py-2">
        {/* Animated Bell Icon with Glow */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#B45CFF]/30 to-[#8B5CF6]/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#202027] to-[#17171C] border border-[#B45CFF]/40 flex items-center justify-center shadow-[0_10px_25px_rgba(180,92,255,0.25)]">
            <Bell className="w-8 h-8 text-[#B45CFF]" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F3FA] tracking-tight">
            Never Miss a Plan 🔔
          </h2>
          <p className="text-sm text-[#A5A0B5] max-w-sm mx-auto leading-relaxed">
            Get notified when friends invite you out or accept your plans, even when BreakTym isn't open.
          </p>
        </div>

        {/* Benefits list */}
        <div className="w-full p-4 rounded-xl bg-[#17171C] border border-[#30303A]/60 text-left space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-[#F5F3FA]">
            <Sparkles className="w-4 h-4 text-[#B45CFF] shrink-0" />
            <span>Spontaneous invites from friends delivered instantly</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#F5F3FA]">
            <Sparkles className="w-4 h-4 text-[#86EFAC] shrink-0" />
            <span>Instant alerts when someone says &quot;YES&quot; to your plan</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#A5A0B5]">
            <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0" />
            <span>Zero spam. No random ads. Fully controllable in Settings.</span>
          </div>
        </div>

        {/* Denied / Error Notice */}
        {errorMessage && (
          <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 text-left space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {permissionState === 'denied'
                  ? 'Notifications are blocked by your browser'
                  : 'Could not enable notifications'}
              </span>
            </div>
            <p className="text-[11px] text-[#A5A0B5] leading-relaxed">
              {permissionState === 'denied'
                ? 'To enable: Click the padlock / settings icon next to your browser address bar, set "Notifications" to "Allow", then try again.'
                : errorMessage}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-2">
          <NeomorphicButton
            variant="primary"
            onClick={handleEnableNotifications}
            disabled={isSubscribing}
            className="w-full py-3 text-sm font-bold shadow-[0_10px_25px_rgba(180,92,255,0.3)]"
          >
            {isSubscribing ? 'Connecting...' : 'Enable Notifications'}
          </NeomorphicButton>

          <button
            type="button"
            onClick={handleMaybeLater}
            disabled={isSubscribing}
            className="w-full py-2.5 text-xs font-semibold text-[#A5A0B5] hover:text-[#F5F3FA] transition-colors rounded-xl hover:bg-white/5"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
};
