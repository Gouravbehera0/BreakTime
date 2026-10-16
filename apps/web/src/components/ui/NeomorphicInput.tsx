import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeomorphicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const NeomorphicInput = React.forwardRef<HTMLInputElement, NeomorphicInputProps>(
  ({ label, error, helperText, leadingIcon, isPassword = false, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-[#A5A0B5] px-1">
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leadingIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#A5A0B5]">
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full bg-[#1B1B22] text-[#F5F3FA] placeholder-[#635E74] text-sm md:text-base rounded-xl',
              'border border-[#34313D] shadow-[inset_2px_2px_5px_#101014,inset_-2px_-2px_5px_#262630]',
              'py-3.5 transition-all duration-200 outline-none',
              'focus:border-[#9E65FF] focus:shadow-[inset_2px_2px_5px_#101014,inset_-2px_-2px_5px_#262630,0_0_12px_rgba(180,92,255,0.35)]',
              leadingIcon ? 'pl-11' : 'pl-4',
              isPassword ? 'pr-11' : 'pr-4',
              error && 'border-[#FF6B81] focus:border-[#FF6B81] focus:shadow-[0_0_12px_rgba(255,107,129,0.35)]',
              className
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 p-1 text-[#A5A0B5] hover:text-[#F5F3FA] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[#FF6B81] font-medium px-1 flex items-center mt-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#A5A0B5] px-1 mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

NeomorphicInput.displayName = 'NeomorphicInput';
