export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Liker {
  id: string | number;
  username: string;
  fullName: string;
  avatarUrl?: string;
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
  likers?: Liker[];
  comments?: Comment[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  content: string;
  createdAt: string;
}
