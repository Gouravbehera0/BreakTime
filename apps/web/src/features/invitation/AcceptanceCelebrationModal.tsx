import React, { useEffect, useRef } from 'react';
import { Sparkles, Calendar, X, Clock, CheckCircle2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { ActivityInvitation, getCelebrationHeadline } from '@/types/invitation';

interface AcceptanceCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: ActivityInvitation | null;
  currentUserId: string;
  onViewInvitation: (invitation: ActivityInvitation) => void;
  friendshipStreak?: number;
}

export const AcceptanceCelebrationModal: React.FC<AcceptanceCelebrationModalProps> = ({
  isOpen,
  onClose,
  invitation,
  currentUserId,
  onViewInvitation,
  friendshipStreak = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particle / Confetti Canvas Animation
  useEffect(() => {
    if (!isOpen) return;

    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Color palette: Radiant purple, violet, green, white
    const colors = ['#B45CFF', '#8B5CF6', '#C084FC', '#86EFAC', '#F5F3FA', '#FFD166'];

    interface Particle {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      decay: number;
      shape: 'circle' | 'square' | 'line';
      rotation: number;
      vRot: number;
    }

    const particles: Particle[] = [];
    const particleCount = 45; // Subtle, elegant particle density

    // Spawn from the center outwards
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x: width / 2,
        y: height / 2,
        size: 3 + Math.random() * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        decay: 0.003 + Math.random() * 0.006,
        shape: Math.random() > 0.5 ? 'circle' : 'square',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.08,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // Gentle gravity
        p.vx *= 0.99; // Drag
        p.alpha -= p.decay;
        p.rotation += p.vRot;

        if (p.alpha <= 0) {
          // Recycle back near the center with gentle drift
          p.x = width / 2 + (Math.random() - 0.5) * 120;
          p.y = height / 2 + (Math.random() - 0.5) * 60;
          p.vx = (Math.random() - 0.5) * 2;
          p.vy = -1 - Math.random() * 2;
          p.alpha = 0.8;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !invitation) return null;

  // Determine participants
  const isSender = invitation.senderId === currentUserId;
  const friendName = isSender
    ? invitation.recipientDisplayName || 'Friend'
    : invitation.senderDisplayName || 'Friend';

  // Deterministic headline consistent for both sender and recipient
  const headline = getCelebrationHeadline(invitation.id, invitation.headline);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
      {/* Dimmed backdrop with glassmorphic blur */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Confetti Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10"
      />

      {/* Main Celebration Card */}
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#1C1C23] border border-[#B45CFF]/40 
        shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_36px_rgba(180,92,255,0.35)] 
        p-6 sm:p-8 z-20 text-center select-none transform scale-100 animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-[#B45CFF]/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#A5A0B5] hover:text-[#F5F3FA] hover:bg-white/5 transition-colors"
          aria-label="Close celebration"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Headline */}
        <div className="space-y-1.5 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B45CFF]/15 border border-[#B45CFF]/30 text-xs font-black uppercase tracking-wider text-[#B45CFF] shadow-[0_0_12px_rgba(180,92,255,0.3)]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>BREAK CONFIRMED</span>
          </div>

          <h2
            id="celebration-title"
            className="text-2xl sm:text-3xl font-black text-[#F5F3FA] tracking-tight uppercase drop-shadow-[0_2px_8px_rgba(180,92,255,0.4)]"
          >
            {headline}
          </h2>
        </div>

        {/* Two Participants Connected by Sparkle Bridge */}
        <div className="my-6 relative flex items-center justify-center gap-4 sm:gap-6">
          {/* User A (Sender) */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#B45CFF] shadow-[0_0_16px_rgba(180,92,255,0.4)]">
              <Avatar
                name={invitation.senderDisplayName || 'Sender'}
                avatarUrl={invitation.senderAvatarUrl}
                size="lg"
                isOnline={true}
              />
            </div>
            <span className="text-xs font-bold text-[#F5F3FA] max-w-[100px] truncate">
              {invitation.senderDisplayName || 'Friend'}
            </span>
            <span className="text-[10px] text-[#A5A0B5] font-medium uppercase tracking-wider">
              {isSender ? 'You (Sender)' : 'Sender'}
            </span>
          </div>

          {/* Glowing Connection Bridge */}
          <div className="flex flex-col items-center justify-center -mt-4">
            <div className="w-10 sm:w-16 h-0.5 bg-gradient-to-r from-[#8B5CF6] via-[#86EFAC] to-[#B45CFF] shadow-[0_0_8px_#86EFAC] relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#202027] border border-[#86EFAC] flex items-center justify-center shadow-[0_0_12px_rgba(134,239,172,0.4)]">
                <span className="text-xs">⚡</span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-[#86EFAC] tracking-widest uppercase mt-2">
              CONNECTED
            </span>
          </div>

          {/* User B (Recipient) */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#86EFAC] to-[#B45CFF] shadow-[0_0_16px_rgba(134,239,172,0.4)]">
              <Avatar
                name={invitation.recipientDisplayName || 'Recipient'}
                avatarUrl={invitation.recipientAvatarUrl}
                size="lg"
                isOnline={true}
              />
            </div>
            <span className="text-xs font-bold text-[#F5F3FA] max-w-[100px] truncate">
              {invitation.recipientDisplayName || 'Friend'}
            </span>
            <span className="text-[10px] text-[#86EFAC] font-medium uppercase tracking-wider">
              {!isSender ? 'You (Accepted)' : 'Accepted'}
            </span>
          </div>
        </div>

        {/* Accepted Activity Details Card */}
        <div className="p-4 rounded-2xl bg-[#202027] border border-[#30303A] shadow-[-3px_-3px_8px_#30303A,4px_4px_10px_#101014] space-y-2 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A5A0B5]">
              ACTIVITY PLAN
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#86EFAC]/15 border border-[#86EFAC]/30 text-[#86EFAC] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>INVITATION ACCEPTED</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B45CFF]/15 border border-[#B45CFF]/30 text-[#B45CFF] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {invitation.meetingStatus === 'completed'
                    ? 'MEETING COMPLETED'
                    : invitation.meetingStatus === 'cancelled'
                    ? 'MEETING CANCELLED'
                    : 'MEETING PENDING'}
                </span>
              </span>
            </div>
          </div>

          <p className="text-lg sm:text-xl font-black text-[#F5F3FA]">
            {invitation.activityTitle}
          </p>

          {invitation.customNote && (
            <p className="text-xs italic text-[#A5A0B5] bg-[#17171C] p-2.5 rounded-xl border border-white/5">
              "{invitation.customNote}"
            </p>
          )}

          <p className="text-[11px] font-medium text-[#A5A0B5] pt-1">
            The invite was accepted. Now make it happen. ✨
          </p>
        </div>

        {/* Optional Friendship Streak Banner */}
        {friendshipStreak > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-[#202027] to-[#1A1A21] border border-[#B45CFF]/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F3FA]">
              <span className="text-base select-none">🔥</span>
              <span>
                YOU & {friendName.toUpperCase()} STREAK:
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#B45CFF]/20 text-[#B45CFF] text-xs font-black shadow-[0_0_8px_rgba(180,92,255,0.3)]">
              {friendshipStreak} ACCEPTED INVITES
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <NeomorphicButton
            variant="primary"
            onClick={() => {
              onClose();
              onViewInvitation(invitation);
            }}
            className="w-full sm:flex-1 py-3 text-xs sm:text-sm font-bold"
            icon={<Calendar className="w-4 h-4" />}
          >
            View Invitation
          </NeomorphicButton>

          <NeomorphicButton
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 text-xs text-[#A5A0B5] hover:text-[#F5F3FA]"
          >
            Dismiss
          </NeomorphicButton>
        </div>
      </div>
    </div>
  );
};
