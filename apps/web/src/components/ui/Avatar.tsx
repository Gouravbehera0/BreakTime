import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  isOnline = false,
  showStatus = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl font-bold',
  }[size];

  const dotSizes = {
    sm: 'w-2.5 h-2.5 right-0 bottom-0 border-[1.5px]',
    md: 'w-3 h-3 right-0.5 bottom-0.5 border-2',
    lg: 'w-3.5 h-3.5 right-0.5 bottom-0.5 border-2',
    xl: 'w-4 h-4 right-1 bottom-1 border-2',
  }[size];

  // Derive initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'BT';

  return (
    <div className={`relative inline-block select-none ${className}`}>
      <div
        className={`${sizeClasses} rounded-full flex items-center justify-center font-semibold 
        bg-gradient-to-tr from-[#202027] to-[#30303A] border border-white/10 text-[#F5F3FA] 
        shadow-[-2px_-2px_6px_#30303A,3px_3px_8px_#101014] overflow-hidden`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showStatus && (
        <span
          className={`absolute ${dotSizes} rounded-full border-[#17171C] ${
            isOnline
              ? 'bg-[#86EFAC] shadow-[0_0_8px_#86EFAC]'
              : 'bg-[#777581]'
          }`}
          title={isOnline ? 'Active now' : 'Offline'}
        />
      )}
    </div>
  );
};
