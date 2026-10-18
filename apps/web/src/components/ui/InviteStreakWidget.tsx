import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteStreakWidgetProps {
  variant?: 'personal' | 'friendship' | 'compact';
  count: number;
  friendName?: string;
  className?: string;
  onClick?: () => void;
}

export const InviteStreakWidget: React.FC<InviteStreakWidgetProps> = ({
  variant = 'personal',
  count,
  friendName = 'Friend',
  className = '',
  onClick,
}) => {
  if (variant === 'friendship') {
    return (
      <div
        onClick={onClick}
        className={cn(
          'relative p-3 rounded-2xl bg-gradient-to-br from-[#202027] to-[#1A1A21]',
          'border border-[#B45CFF]/30 shadow-[-2px_-2px_6px_#30303A,3px_3px_8px_#101014]',
          'flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left select-none',
          onClick && 'cursor-pointer hover:border-[#B45CFF]/60 hover:shadow-[0_0_16px_rgba(180,92,255,0.25)] transition-all',
          className
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#B45CFF]/15 border border-[#B45CFF]/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(180,92,255,0.25)]">
            <span className="text-base select-none">🔥</span>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A5A0B5]">
              YOU & {friendName.toUpperCase()}
            </p>
            <p className="text-xs sm:text-sm font-black text-[#F5F3FA] flex items-center gap-1.5 mt-0.5">
              <span>{count}</span>
              <span className="text-[11px] font-semibold text-[#B45CFF]">ACCEPTED INVITES</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-[#86EFAC] bg-[#86EFAC]/10 px-2 py-0.5 rounded-full border border-[#86EFAC]/25">
          <Sparkles className="w-3 h-3" />
          <span>Vibe Certified</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202027] border border-[#B45CFF]/30',
          'shadow-[-2px_-2px_5px_#30303A,2px_2px_5px_#101014] text-xs font-bold text-[#F5F3FA] select-none',
          onClick && 'cursor-pointer hover:border-[#B45CFF]/60 transition-all',
          className
        )}
      >
        <span>🔥</span>
        <span className="text-[#B45CFF]">{count}</span>
        <span className="text-[10px] text-[#A5A0B5] font-semibold uppercase tracking-wider">
          {friendName ? `${friendName} Streak` : 'Streak'}
        </span>
      </div>
    );
  }

  // Default: Personal streak widget
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-2xl bg-gradient-to-br from-[#202027] to-[#1C1C23]',
        'border border-[#B45CFF]/35 shadow-[-3px_-3px_8px_#30303A,4px_4px_10px_#101014]',
        'flex flex-col items-center justify-center text-center select-none group',
        onClick && 'cursor-pointer hover:border-[#B45CFF]/60 hover:shadow-[0_0_20px_rgba(180,92,255,0.3)] transition-all',
        className
      )}
    >
      {/* Glow highlight */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-10 bg-[#B45CFF]/20 rounded-full blur-xl pointer-events-none" />

      {/* Header Pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B45CFF]/15 border border-[#B45CFF]/30 text-[10px] font-black uppercase tracking-wider text-[#B45CFF]">
        <Flame className="w-3 h-3 animate-pulse text-[#B45CFF]" />
        <span>INVITE STREAK</span>
      </div>

      {/* Large Count */}
      <div className="my-1.5 flex items-baseline justify-center gap-1">
        <span className="text-3xl sm:text-4xl font-black text-[#F5F3FA] tracking-tight drop-shadow-[0_2px_10px_rgba(180,92,255,0.3)]">
          {count}
        </span>
      </div>

      {/* Footer Label */}
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#A5A0B5]">
        INVITATIONS ACCEPTED
      </p>
    </div>
  );
};
