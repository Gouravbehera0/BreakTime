import React from 'react';
import { Home, Users, Send, User, Settings } from 'lucide-react';

export type NavTab = 'home' | 'friends' | 'invitation' | 'profile' | 'settings';

interface FloatingNavBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingRequestsCount?: number;
  pendingInvitationsCount?: number;
}

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({
  currentTab,
  onTabChange,
  pendingRequestsCount = 0,
  pendingInvitationsCount = 0,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'friends' as NavTab, label: 'Circles', icon: Users, badge: pendingRequestsCount },
    { id: 'invitation' as NavTab, label: 'Invite', icon: Send, badge: pendingInvitationsCount },
    { id: 'profile' as NavTab, label: 'Profile', icon: User },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md pointer-events-none">
      <div
        className="pointer-events-auto flex items-center justify-between px-3 py-2.5 rounded-2xl 
        bg-[#1C1C23]/90 backdrop-blur-xl border border-[#B45CFF]/20 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_20px_rgba(180,92,255,0.15)]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 select-none ${
                isActive
                  ? 'text-[#B45CFF] font-semibold bg-[#B45CFF]/15 shadow-[0_0_12px_rgba(180,92,255,0.25)]'
                  : 'text-[#A5A0B5] hover:text-[#F5F3FA] hover:bg-white/5 font-medium'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-[#B45CFF] text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_6px_#B45CFF]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
