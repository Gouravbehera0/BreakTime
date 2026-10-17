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
  username?: string | null;
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
  | 'blocked'
  | 'self';

export interface ContactPerson {
  id: string;
  displayName: string;
  phoneNumbers: string[];
}

export interface DiscoveredUserProfile {
  userId: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  friendshipStatus: FriendshipStatus;
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
  senderId?: string;
  recipientId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserUsername?: string | null;
  otherUserAvatarUrl?: string;
  otherUserPhone?: string;
  isIncoming: boolean;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}
