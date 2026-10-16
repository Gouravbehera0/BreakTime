import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeomorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  showArrow?: boolean;
  icon?: React.ReactNode;
}

export const NeomorphicButton: React.FC<NeomorphicButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  showArrow = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'relative flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const variants = {
    primary: 'bg-gradient-to-r from-[#8B5CF6] to-[#B45CFF] text-white shadow-[0_4px_16px_rgba(180,92,255,0.4)] hover:shadow-[0_6px_22px_rgba(180,92,255,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_8px_rgba(180,92,255,0.4)]',
    secondary: 'bg-[#202027] text-[#F5F3FA] border border-[#30303A]/60 shadow-[-2px_-2px_6px_#30303A,3px_3px_8px_#101014] hover:border-[#B45CFF]/40 hover:text-white active:shadow-inner',
    ghost: 'bg-transparent text-[#A5A0B5] hover:text-[#F5F3FA] hover:bg-white/5',
    danger: 'bg-gradient-to-r from-red-600 to-[#FF6B81] text-white shadow-[0_4px_14px_rgba(255,107,129,0.35)] hover:-translate-y-0.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], 'px-5 py-3 text-sm md:text-base', className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}

      <span>{children}</span>

      {showArrow && !isLoading && (
        <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-0.5" />
      )}
    </button>
  );
};
