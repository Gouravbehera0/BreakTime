export type RelationshipType =
  | 'LOVER'
  | 'BESTFRIENDS'
  | 'FRIENDS'
  | 'BHAI'
  | 'SISTER'
  | 'FAMILY'
  | 'COLLEGE'
  | 'CRUSH'
  | 'OTHER';

export interface Contact {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  statusText: string;
  relationship: RelationshipType;
  relationshipCreatorId?: string;
  privateNickname?: string;
  nicknameCreatorId?: string;
  isPinned: boolean;
  phoneNumber?: string;
  bio?: string;
  lastActiveTimestamp?: number;
}

export type ContactFilter = 'ALL' | 'ONLINE' | 'OFFLINE' | 'PINNED';

export type FriendshipStatus =
  | 'none'
  | 'friends'
  | 'pending_sent'
  | 'pending_received'
  | 'blocked';

export interface ContactPerson {
  id: string;
  displayName: string;
  phoneNumbers: string[];
}

export interface DiscoveredContact {
  contact: ContactPerson;
  isBreakTymUser: boolean;
  breakTymUserId?: string;
  breakTymDisplayName?: string;
  breakTymAvatarUrl?: string;
  friendshipStatus: FriendshipStatus;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  otherUserPhone?: string;
  isIncoming: boolean;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt?: string;
}
