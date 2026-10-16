import React from 'react';
import { cn } from '@/lib/utils';

interface NeomorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  subtle?: boolean;
  className?: string;
}

export const NeomorphicCard: React.FC<NeomorphicCardProps> = ({
  children,
  interactive = false,
  subtle = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-200',
        subtle
          ? 'bg-[#202027] border-white/5 shadow-[-2px_-2px_6px_rgba(48,48,58,0.6),4px_4px_8px_rgba(16,16,20,0.8)]'
          : 'bg-gradient-to-br from-[#202027] to-[#1A1A21] border-[#30303A]/50 shadow-[-4px_-4px_10px_#30303A,6px_6px_14px_#101014]',
        interactive && 'cursor-pointer hover:-translate-y-0.5 hover:border-[#B45CFF]/30 hover:shadow-[-5px_-5px_12px_#343440,8px_8px_18px_#0D0D11,0_0_16px_rgba(180,92,255,0.25)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
