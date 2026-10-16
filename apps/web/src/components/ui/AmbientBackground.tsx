import React from 'react';

interface AmbientBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen w-full bg-[#17171C] overflow-hidden ${className}`}>
      {/* Background Ambient Cosmic Orbs */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#B45CFF]/12 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-[#8B5CF6]/10 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/4 w-[480px] h-80 rounded-full bg-[#B45CFF]/8 blur-[110px]"
        aria-hidden="true"
      />

      {/* Content wrapper */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};
