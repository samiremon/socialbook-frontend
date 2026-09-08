export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  isEmailVerified?: boolean;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  createdAt?: string;
  isActive?: boolean;
  isDemo?: boolean;
}

export interface UserEmailItem {
  id: number;
  email: string;
  isVerified: boolean;
  isPrimary?: boolean;
  createdAt?: string;
}

export interface AccountSettingsData {
  id: number;
  username: string;
  fullName: string;
  primaryEmail: string;
  isPrimaryEmailVerified: boolean;
  additionalEmails: UserEmailItem[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface Liker {
  id: string | number;
  username: string;
  fullName: string;
  avatarUrl?: string;
  reactionType?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likesCount?: number;
  isLikedByCurrentUser?: boolean;
  userReaction?: string;
  reactionCounts?: Record<string, number>;
  likers?: Liker[];
  comments?: Comment[];
  sharesCount?: number;
  isShared?: boolean;
  sharedPost?: {
    id: string;
    authorName: string;
    authorUsername: string;
    authorAvatar?: string;
    content: string;
    imageUrl?: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

export interface Conversation {
  partnerId: number | string;
  partnerName: string;
  partnerUsername: string;
  partnerAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  isLastMessageFromMe: boolean;
  unreadCount: number;
}

export interface NotificationItem {
  id: number | string;
  userId: number | string;
  actorId: number | string;
  actorName: string;
  actorUsername: string;
  actorAvatar?: string;
  type: 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPT' | 'MESSAGE' | 'SHARE' | string;
  content: string;
  targetId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface FriendRequest {
  id: number;
  requesterId: number;
  requesterName: string;
  requesterUsername: string;
  requesterAvatar?: string;
  createdAt: string;
}

export interface FriendUser {
  id: number | string;
  friendshipId?: number;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  status?: 'NONE' | 'FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED';
  isActive?: boolean;
}

// 24-Hour Story Item
export interface StoryItem {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  imageUrl?: string;
  text?: string;
  bgGradient?: string;
  createdAt: string;
  expiresAt: string; // Exactly 24 hours after creation
  isViewed?: boolean;
}

// Profile Story Highlight
export interface HighlightItem {
  id: string;
  userId: string;
  title: string;
  coverUrl: string;
  createdAt: string;
}
