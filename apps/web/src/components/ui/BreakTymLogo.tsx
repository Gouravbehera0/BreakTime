import React from 'react';

export interface BreakTymLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * If true, displays the official tagline "Pause the World. Live the Moment." beneath the logo.
   * `showText` is supported as an alias for backward compatibility.
   */
  showTagline?: boolean;
  showText?: boolean;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

export const BreakTymLogo: React.FC<BreakTymLogoProps> = ({
  size = 'md',
  showTagline,
  showText,
  className = '',
  imgClassName = '',
  priority = false,
}) => {
  // Respect either showTagline or showText
  const displayTagline = showTagline ?? showText ?? false;

  // Responsive scale constraints preserving the original 3:1 aspect ratio without stretching
  const sizeStyles = {
    xs: {
      img: 'h-6 sm:h-7 max-w-[96px]',
      tagline: 'text-[9px] mt-1',
    },
    sm: {
      img: 'h-8 sm:h-9 max-w-[124px]',
      tagline: 'text-[10px] mt-1',
    },
    md: {
      img: 'h-11 sm:h-12 max-w-[168px]',
      tagline: 'text-xs mt-1.5',
    },
    lg: {
      img: 'h-14 sm:h-16 md:h-20 max-w-[260px]',
      tagline: 'text-xs sm:text-sm mt-2',
    },
    xl: {
      img: 'h-20 sm:h-24 md:h-28 max-w-[340px]',
      tagline: 'text-sm sm:text-base mt-2.5',
    },
  }[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      {/* Official BreakTym Brand Logo */}
      <img
        src="/assets/breaktym-logo.png"
        alt="BreakTym — Pause the World. Live the Moment."
        className={`w-auto object-contain transition-all duration-300 drop-shadow-[0_2px_16px_rgba(180,92,255,0.22)] ${sizeStyles.img} ${imgClassName}`}
        style={{ objectFit: 'contain' }}
        draggable={false}
        loading={priority ? 'eager' : 'lazy'}
      />

      {/* Official Tagline */}
      {displayTagline && (
        <p className={`text-[#A5A0B5] font-medium tracking-wide text-center ${sizeStyles.tagline}`}>
          Pause the World. Live the Moment.
        </p>
      )}
    </div>
  );
};
