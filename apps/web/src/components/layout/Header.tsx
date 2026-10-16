import React from 'react';
import { Bell, LogOut, Sparkles } from 'lucide-react';
import { BreakTymLogo } from '@/components/ui/BreakTymLogo';
import { Avatar } from '@/components/ui/Avatar';
import { UserProfile } from '@/types/auth';

interface HeaderProps {
  userProfile: UserProfile | null;
  onProfileClick: () => void;
  onSignOutClick: () => void;
  onNotificationClick: () => void;
  hasUnreadNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  onProfileClick,
  onSignOutClick,
  onNotificationClick,
  hasUnreadNotifications = false,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#17171C]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="BreakTym — Pause the World. Live the Moment."
        >
          <BreakTymLogo size="sm" priority={true} />
          <span className="text-[11px] text-[#A5A0B5]/80 font-medium hidden lg:inline-block border-l border-white/10 pl-3">
            Pause the World. Live the Moment.
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Spontaneous Plan Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#B45CFF]/10 border border-[#B45CFF]/20 text-xs text-[#B45CFF] font-medium">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Spontaneous Tym</span>
          </div>

          {/* Notifications Button */}
          <button
            onClick={onNotificationClick}
            className="relative p-2.5 rounded-full bg-[#202027] text-[#A5A0B5] hover:text-[#F5F3FA] border border-[#30303A]/60 shadow-[-2px_-2px_5px_#30303A,3px_3px_6px_#101014] transition-all hover:border-[#B45CFF]/40"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B45CFF] shadow-[0_0_6px_#B45CFF]" />
            )}
          </button>

          {/* User Profile Pill */}
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-[#202027] border border-[#30303A]/60 shadow-[-2px_-2px_5px_#30303A,3px_3px_6px_#101014] hover:border-[#B45CFF]/40 transition-all text-left"
            aria-label="User profile"
          >
            <Avatar
              name={userProfile?.displayName || 'You'}
              avatarUrl={userProfile?.avatarUrl}
              size="sm"
              isOnline={true}
              showStatus={true}
            />
            <span className="text-xs font-semibold text-[#F5F3FA] hidden sm:inline-block max-w-[100px] truncate">
              {userProfile?.displayName || 'My Profile'}
            </span>
          </button>

          {/* Sign Out */}
          <button
            onClick={onSignOutClick}
            className="p-2.5 rounded-full bg-[#202027] text-[#A5A0B5] hover:text-[#FF6B81] border border-[#30303A]/60 shadow-[-2px_-2px_5px_#30303A,3px_3px_6px_#101014] hover:border-[#FF6B81]/40 transition-all"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
