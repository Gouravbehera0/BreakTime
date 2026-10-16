import React from 'react';
import { RelationshipType } from '@/types/contact';

interface RelationshipBadgeProps {
  relationship: RelationshipType;
  className?: string;
}

export const RelationshipBadge: React.FC<RelationshipBadgeProps> = ({ relationship, className = '' }) => {
  const configs: Record<RelationshipType, { label: string; icon: string; bg: string; text: string; border: string }> = {
    LOVER: {
      label: 'LOVER',
      icon: '♥',
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
    },
    BESTFRIENDS: {
      label: 'BESTIES',
      icon: '⚡',
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
    },
    FRIENDS: {
      label: 'FRIENDS',
      icon: '👥',
      bg: 'bg-[#B45CFF]/15',
      text: 'text-[#B45CFF]',
      border: 'border-[#B45CFF]/30',
    },
    BHAI: {
      label: 'BHAI',
      icon: '👊',
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    SISTER: {
      label: 'SISTER',
      icon: '✨',
      bg: 'bg-pink-500/15',
      text: 'text-pink-400',
      border: 'border-pink-500/30',
    },
    FAMILY: {
      label: 'FAMILY',
      icon: '🏡',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    COLLEGE: {
      label: 'COLLEGE',
      icon: '🎓',
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
    },
    CRUSH: {
      label: 'CRUSH',
      icon: '💘',
      bg: 'bg-fuchsia-500/20',
      text: 'text-fuchsia-300',
      border: 'border-fuchsia-500/40',
    },
    OTHER: {
      label: 'CIRCLE',
      icon: '✨',
      bg: 'bg-purple-500/10',
      text: 'text-purple-300',
      border: 'border-purple-500/20',
    },
  };

  const item = configs[relationship] || configs.OTHER;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.bg} ${item.text} ${item.border} ${className}`}
    >
      <span>{item.icon}</span>
      <span>{item.label}</span>
    </span>
  );
};
