import axios from 'axios';
import { User, Post, Comment, Message, Liker, ReactionType, NotificationItem, FriendRequest, FriendUser, Conversation, AccountSettingsData, UserEmailItem } from './types';

// Base Axios instance pointing to .NET backend
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5116/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically to every request if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// MOCK DATA STORAGE (Local fallback / offline preview)
// ==========================================
let mockUsers: User[] = [
  {
    id: '1',
    username: 'john_doe',
    fullName: 'John Doe',
    email: 'john@example.com',
    bio: 'Software engineer building modern apps with ASP.NET & React! Welcome to my OpenSocial profile 🚀',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: '2',
    username: 'sarah_smith',
    fullName: 'Sarah Smith',
    email: 'sarah@opensocial.com',
    bio: 'Product Designer & Coffee lover ☕. Welcome to OpenSocial!',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: '3',
    username: 'david_miller',
    fullName: 'David Miller',
    email: 'david@opensocial.com',
    bio: 'Tech lead & open source contributor. Love cloud architecture.',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: '4',
    username: 'emily_rose',
    fullName: 'Emily Rose',
    email: 'emily@opensocial.com',
    bio: 'Photographer & UI traveler ✈️ Living life in color.',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80',
    isActive: false,
  },
  {
    id: '5',
    username: 'alex_green',
    fullName: 'Alex Green',
    email: 'alex@opensocial.com',
    bio: 'Frontend enthusiast & nature lover 🌿',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: '6',
    username: 'lisa_wang',
    fullName: 'Lisa Wang',
    email: 'lisa@opensocial.com',
    bio: 'Mobile dev & runner 🏃‍♀️ Building great things.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    isActive: false,
  },
  {
    id: '7',
    username: 'michael_c',
    fullName: 'Michael Chang',
    email: 'michael@opensocial.com',
    bio: 'Data scientist & chess enthusiast ♟️',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
];

let mockPosts: Post[] = [
  {
    id: '99',
    authorId: '6',
    authorName: 'Samir Khan',
    authorUsername: 'samir_khan',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    content: 'Totally agree with John here! The new OpenSocial design and layout is fantastic 🙌',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    likesCount: 4,
    isLikedByCurrentUser: false,
    reactionCounts: { LIKE: 2, LOVE: 2 },
    sharesCount: 1,
    isShared: true,
    sharedPost: {
      id: '100',
      authorName: 'John Doe',
      authorUsername: 'john_doe',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      content: 'Excited to showcase OpenSocial! 🚀\n\nBuilt with a clean Facebook-inspired layout, 24-hour disappearing stories, animated emoji reactions, and a real-time messenger with Seen receipts.',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    },
    comments: [],
  },
  {
    id: '100',
    authorId: '1',
    authorName: 'John Doe',
    authorUsername: 'john_doe',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    content: 'Excited to showcase OpenSocial! 🚀\n\nBuilt with a clean Facebook-inspired layout, 24-hour disappearing stories, animated emoji reactions, and a real-time messenger with Seen receipts. Explore all features and let me know your thoughts!',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    likesCount: 5,
    isLikedByCurrentUser: true,
    userReaction: 'LIKE',
    reactionCounts: { LIKE: 2, LOVE: 2, HAHA: 1 },
    sharesCount: 3,
    likers: [
      { id: '2', username: 'sarah_smith', fullName: 'Sarah Smith', reactionType: 'LOVE' },
      { id: '3', username: 'david_miller', fullName: 'David Miller', reactionType: 'HAHA' },
      { id: '4', username: 'emily_rose', fullName: 'Emily Rose', reactionType: 'LIKE' },
      { id: '5', username: 'alex_green', fullName: 'Alex Green', reactionType: 'LOVE' },
    ],
    comments: [
      {
        id: 'c1',
        postId: '100',
        authorId: '2',
        authorName: 'Sarah Smith',
        authorUsername: 'sarah_smith',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        content: 'The blue theme and reaction animations are super smooth! Love it 👏',
        createdAt: new Date(Date.now() - 1200000).toISOString(),
      },
      {
        id: 'c2',
        postId: '100',
        authorId: '4',
        authorName: 'Emily Rose',
        authorUsername: 'emily_rose',
        authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80',
        content: 'The stories timer and active status are really well aligned.',
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
    ],
  },
  {
    id: '101',
    authorId: '2',
    authorName: 'Sarah Smith',
    authorUsername: 'sarah_smith',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    content: 'Exploring beautiful coastal views this weekend! 🌊 So grateful for friends and sunshine. Hope everyone is having a wonderful day!',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    likesCount: 8,
    isLikedByCurrentUser: true,
    userReaction: 'LOVE',
    reactionCounts: { LOVE: 5, WOW: 2, LIKE: 1 },
    sharesCount: 2,
    likers: [
      { id: '1', username: 'john_doe', fullName: 'John Doe', reactionType: 'LOVE' },
      { id: '3', username: 'david_miller', fullName: 'David Miller', reactionType: 'WOW' },
      { id: '4', username: 'emily_rose', fullName: 'Emily Rose', reactionType: 'LOVE' },
    ],
    comments: [
      {
        id: 'c3',
        postId: '101',
        authorId: '1',
        authorName: 'John Doe',
        authorUsername: 'john_doe',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
        content: 'Stunning view Sarah! Enjoy the beach.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: '102',
    authorId: '3',
    authorName: 'David Miller',
    authorUsername: 'david_miller',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    content: 'Full-stack engineering tip: Keep your domain models clean and your UI reactive. What tech stack are you building with today? 💻☕',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    likesCount: 4,
    isLikedByCurrentUser: false,
    reactionCounts: { LIKE: 3, WOW: 1 },
    sharesCount: 1,
    likers: [
      { id: '5', username: 'alex_green', fullName: 'Alex Green', reactionType: 'LIKE' },
      { id: '2', username: 'sarah_smith', fullName: 'Sarah Smith', reactionType: 'LIKE' },
    ],
    comments: [],
  },
];

let mockNotifications: NotificationItem[] = [
  {
    id: 1,
    userId: '1',
    actorId: '2',
    actorName: 'Sarah Smith',
    actorUsername: 'sarah_smith',
    actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    type: 'LIKE',
    content: 'Sarah Smith reacted ❤️ to your post.',
    isRead: false,
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 2,
    userId: '1',
    actorId: '3',
    actorName: 'David Miller',
    actorUsername: 'david_miller',
    actorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    type: 'FRIEND_REQUEST',
    content: 'David Miller sent you a friend request.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 3,
    userId: '1',
    actorId: '4',
    actorName: 'Emily Rose',
    actorUsername: 'emily_rose',
    actorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80',
    type: 'COMMENT',
    content: 'Emily Rose commented on your post.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 4,
    userId: '1',
    actorId: '5',
    actorName: 'Alex Green',
    actorUsername: 'alex_green',
    actorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    type: 'SHARE',
    content: 'Alex Green shared your post.',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

let mockMessages: Message[] = [
  // Conversation with Sarah Smith (partnerId: 2)
  {
    id: 'm1',
    senderId: '2',
    receiverId: '1',
    senderName: 'Sarah Smith',
    content: 'Hey John! How are the new OpenSocial features coming along?',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    isRead: true,
  },
  {
    id: 'm2',
    senderId: '1',
    receiverId: '2',
    senderName: 'John Doe',
    content: 'Hey Sarah! Just shipped 24h stories, highlights, and Facebook emoji reactions! 🚀',
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    isRead: true,
  },
  {
    id: 'm3',
    senderId: '2',
    receiverId: '1',
    senderName: 'Sarah Smith',
    content: 'Testing the new reactions right now! The blue theme feels so fast 🎉',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    isRead: false,
  },
  // Conversation with Emily Rose (partnerId: 4)
  {
    id: 'm4',
    senderId: '4',
    receiverId: '1',
    senderName: 'Emily Rose',
    content: 'Loved your latest post John! The highlights feature looks great.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    isRead: true,
  },
  {
    id: 'm5',
    senderId: '1',
    receiverId: '4',
    senderName: 'John Doe',
    content: 'Thanks Emily! Really appreciate your design feedback 🎨',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    isRead: true,
  },
];

// Load local storage overrides
try {
  const sp = localStorage.getItem('app_posts');
  if (sp) mockPosts = JSON.parse(sp);
  const su = localStorage.getItem('app_users');
  if (su) mockUsers = JSON.parse(su);
  const sm = localStorage.getItem('app_messages');
  if (sm) mockMessages = JSON.parse(sm);
} catch {}

const saveLocal = () => {
  localStorage.setItem('app_posts', JSON.stringify(mockPosts));
  localStorage.setItem('app_users', JSON.stringify(mockUsers));
  localStorage.setItem('app_messages', JSON.stringify(mockMessages));
};

// ==========================================
// 1. AUTH API
// ==========================================
export const authApi = {
  login: async (emailOrUsername: string, password: string): Promise<{ token: string; user: User }> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const user = mockUsers.find((u) => u.email === emailOrUsername || u.username === emailOrUsername) || mockUsers[0];
      const token = 'mock_jwt_token';
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    }
    const res = await apiClient.post('/auth/login', { emailOrUsername, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  },

  register: async (fullName: string, username: string, email: string, password: string): Promise<{ token: string; user: User }> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const newUser: User = {
        id: Date.now().toString(),
        fullName,
        username,
        email,
        bio: 'Hello! I just joined OpenSocial.',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      };
      mockUsers.push(newUser);
      saveLocal();
      const token = 'mock_jwt_token';
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      return { token, user: newUser };
    }
    const res = await apiClient.post('/auth/register', { fullName, username, email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getFreshProfile: async (userId: string): Promise<User | null> => {
    try {
      const res = await apiClient.get<User>(`/users/${userId}`);
      return res.data;
    } catch {
      return null;
    }
  },
};

// ==========================================
// 2. POSTS API
// ==========================================
const parseSharedContent = (rawContent: string) => {
  const match = rawContent.match(/^<!--SHARED_POST:(\{.*?\})-->([\s\S]*)$/);
  if (match) {
    try {
      const sharedPost = JSON.parse(match[1]);
      return {
        isShared: true,
        sharedPost,
        content: match[2].trim(),
      };
    } catch {}
  }
  return { isShared: false, sharedPost: undefined, content: rawContent };
};

// Helper to determine if current session is browsing as demo user (John Doe)
export const isCurrentDemo = (): boolean => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return true;
    const u = JSON.parse(raw);
    return Boolean(u.isDemo || u.username === 'john_doe' || !localStorage.getItem('token'));
  } catch {
    return true;
  }
};

export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    let postsList: Post[] = [];
    if (USE_MOCK || isCurrentDemo()) {
      await new Promise((r) => setTimeout(r, 100));
      postsList = [...mockPosts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      try {
        const res = await apiClient.get<Post[]>('/posts');
        postsList = res.data;
      } catch (err) {
        console.warn('Backend posts API failed, using fallback feed:', err);
        postsList = [...mockPosts].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    }

    // Parse shared post markers if present
    return postsList.map((p) => {
      if (p.content && p.content.startsWith('<!--SHARED_POST:')) {
        const { isShared, sharedPost, content } = parseSharedContent(p.content);
        return {
          ...p,
          content,
          isShared,
          sharedPost,
        };
      }
      return p;
    });
  },

  create: async (content: string, currentUser: User, imageUrl?: string): Promise<Post> => {
    if (USE_MOCK || isCurrentDemo()) {
      await new Promise((r) => setTimeout(r, 150));
      const newPost: Post = {
        id: Date.now().toString(),
        authorId: currentUser.id,
        authorName: currentUser.fullName,
        authorUsername: currentUser.username,
        authorAvatar: currentUser.avatarUrl,
        content,
        imageUrl,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLikedByCurrentUser: false,
        reactionCounts: {},
        comments: [],
        sharesCount: 0,
      };
      mockPosts.push(newPost);
      saveLocal();
      return newPost;
    }
    const res = await apiClient.post<Post>('/posts', { content, imageUrl });
    return res.data;
  },

  delete: async (postId: string | number): Promise<void> => {
    if (USE_MOCK || isCurrentDemo()) {
      mockPosts = mockPosts.filter((p) => String(p.id) !== String(postId));
      saveLocal();
      return;
    }
    await apiClient.delete(`/posts/${postId}`);
  },

  toggleLike: async (
    postId: string | number,
    reactionType: ReactionType = 'LIKE'
  ): Promise<{
    isLiked: boolean;
    userReaction?: string;
    likesCount: number;
    reactionCounts?: Record<string, number>;
    likers?: Liker[];
  }> => {
    if (USE_MOCK || isCurrentDemo()) {
      const p = mockPosts.find((item) => String(item.id) === String(postId));
      if (p) {
        if (p.isLikedByCurrentUser && p.userReaction === reactionType) {
          p.isLikedByCurrentUser = false;
          p.userReaction = undefined;
          p.likesCount = Math.max(0, (p.likesCount || 1) - 1);
        } else {
          p.isLikedByCurrentUser = true;
          p.userReaction = reactionType;
          p.likesCount = (p.likesCount || 0) + (p.isLikedByCurrentUser ? 0 : 1);
        }
        saveLocal();
        return {
          isLiked: p.isLikedByCurrentUser || false,
          userReaction: p.userReaction,
          likesCount: p.likesCount || 0,
          reactionCounts: p.reactionCounts || {},
          likers: p.likers || [],
        };
      }
      return { isLiked: false, likesCount: 0 };
    }
    const res = await apiClient.post(`/posts/${postId}/like`, { reactionType });
    return res.data;
  },

  share: async (
    _postId: string | number,
    thought: string,
    currentUser: User,
    originalPost?: Post
  ): Promise<Post> => {
    const sharedData = originalPost
      ? {
          id: String(originalPost.id),
          authorName: originalPost.authorName,
          authorUsername: originalPost.authorUsername,
          authorAvatar: originalPost.authorAvatar,
          content: originalPost.content,
          imageUrl: originalPost.imageUrl,
          createdAt: originalPost.createdAt,
        }
      : undefined;

    const encodedContent = sharedData
      ? `<!--SHARED_POST:${JSON.stringify(sharedData)}-->${thought.trim()}`
      : thought.trim();

    if (USE_MOCK || isCurrentDemo()) {
      const newPost: Post = {
        id: Date.now().toString(),
        authorId: currentUser.id,
        authorName: currentUser.fullName,
        authorUsername: currentUser.username,
        authorAvatar: currentUser.avatarUrl,
        content: thought.trim(),
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLikedByCurrentUser: false,
        reactionCounts: {},
        comments: [],
        sharesCount: 0,
        isShared: true,
        sharedPost: sharedData,
      };
      mockPosts.push(newPost);
      saveLocal();
      return newPost;
    }

    const res = await apiClient.post<Post>('/posts', { content: encodedContent });
    return {
      ...res.data,
      content: thought.trim(),
      isShared: true,
      sharedPost: sharedData,
    };
  },
};

// ==========================================
// 3. COMMENTS API
// ==========================================
export const commentsApi = {
  add: async (postId: string | number, content: string, currentUser: User): Promise<Comment> => {
    if (USE_MOCK || isCurrentDemo()) {
      await new Promise((r) => setTimeout(r, 150));
      const newComment: Comment = {
        id: Date.now().toString(),
        postId: String(postId),
        authorId: currentUser.id,
        authorName: currentUser.fullName,
        authorUsername: currentUser.username,
        authorAvatar: currentUser.avatarUrl,
        content,
        createdAt: new Date().toISOString(),
      };
      const post = mockPosts.find((p) => String(p.id) === String(postId));
      if (post) {
        post.comments = [...(post.comments || []), newComment];
        saveLocal();
      }
      return newComment;
    }
    const res = await apiClient.post<Comment>(`/posts/${postId}/comments`, { content });
    return res.data;
  },
};

// ==========================================
// 4. NOTIFICATIONS API
// ==========================================
export const notificationsApi = {
  getAll: async (): Promise<{ unreadCount: number; notifications: NotificationItem[] }> => {
    if (USE_MOCK || isCurrentDemo()) {
      const unreadCount = mockNotifications.filter((n) => !n.isRead).length;
      return { unreadCount, notifications: mockNotifications };
    }
    try {
      const res = await apiClient.get<{ unreadCount: number; notifications: NotificationItem[] }>('/notifications');
      return res.data;
    } catch {
      return { unreadCount: 0, notifications: [] };
    }
  },

  markAsRead: async (id: number | string): Promise<void> => {
    if (USE_MOCK || isCurrentDemo()) {
      const n = mockNotifications.find((item) => String(item.id) === String(id));
      if (n) n.isRead = true;
      return;
    }
    try {
      await apiClient.put(`/notifications/read/${id}`);
    } catch {}
  },

  markAllAsRead: async (): Promise<void> => {
    if (USE_MOCK || isCurrentDemo()) {
      mockNotifications.forEach((n) => (n.isRead = true));
      return;
    }
    try {
      await apiClient.put('/notifications/read-all');
    } catch {}
  },
};

// ==========================================
// 5. FRIENDSHIPS API
// ==========================================
export const friendshipsApi = {
  getSuggestions: async (): Promise<FriendUser[]> => {
    if (USE_MOCK || isCurrentDemo()) {
      return mockUsers.slice(1).map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        status: 'NONE',
      }));
    }
    try {
      const res = await apiClient.get<FriendUser[]>('/friendships/suggestions');
      return res.data;
    } catch {
      // Fallback: fetch all users and exclude current
      const all = await usersApi.getAll();
      const current = JSON.parse(localStorage.getItem('user') || '{}');
      return all
        .filter((u) => String(u.id) !== String(current.id))
        .map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          avatarUrl: u.avatarUrl,
          bio: u.bio,
          status: 'NONE',
        }));
    }
  },

  getRequests: async (): Promise<FriendRequest[]> => {
    if (USE_MOCK || isCurrentDemo()) {
      return [
        {
          id: 1,
          requesterId: 3,
          requesterName: 'David Miller',
          requesterUsername: 'david_miller',
          requesterAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 2,
          requesterId: 6,
          requesterName: 'Lisa Wang',
          requesterUsername: 'lisa_wang',
          requesterAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
      ];
    }
    try {
      const res = await apiClient.get<FriendRequest[]>('/friendships/requests');
      return res.data;
    } catch {
      return [
        {
          id: 1,
          requesterId: 3,
          requesterName: 'David Miller',
          requesterUsername: 'david_miller',
          requesterAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ];
    }
  },

  getFriends: async (): Promise<FriendUser[]> => {
    if (USE_MOCK || isCurrentDemo()) {
      return [
        {
          id: '2',
          friendshipId: 2,
          username: 'sarah_smith',
          fullName: 'Sarah Smith',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
          bio: 'Product Designer & Coffee lover ☕',
          status: 'FRIENDS',
          isActive: true,
        },
        {
          id: '4',
          friendshipId: 4,
          username: 'emily_rose',
          fullName: 'Emily Rose',
          avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80',
          bio: 'Photographer & UI traveler ✈️',
          status: 'FRIENDS',
          isActive: false,
        },
        {
          id: '5',
          friendshipId: 5,
          username: 'alex_green',
          fullName: 'Alex Green',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
          bio: 'Frontend enthusiast & nature lover 🌿',
          status: 'FRIENDS',
          isActive: true,
        },
      ];
    }
    try {
      const res = await apiClient.get<FriendUser[]>('/friendships/friends');
      return res.data;
    } catch {
      return [
        {
          id: '2',
          friendshipId: 2,
          username: 'sarah_smith',
          fullName: 'Sarah Smith',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
          bio: 'Product Designer & Coffee lover ☕',
          status: 'FRIENDS',
          isActive: true,
        },
      ];
    }
  },

  sendRequest: async (targetUserId: number | string): Promise<{ message: string; status: string }> => {
    if (USE_MOCK || isCurrentDemo()) {
      return { message: 'Friend request sent.', status: 'PENDING' };
    }
    const res = await apiClient.post(`/friendships/request/${targetUserId}`);
    return res.data;
  },

  acceptRequest: async (requestId: number | string): Promise<{ message: string; status: string }> => {
    if (USE_MOCK || isCurrentDemo()) {
      return { message: 'Friend request accepted.', status: 'ACCEPTED' };
    }
    const res = await apiClient.post(`/friendships/accept/${requestId}`);
    return res.data;
  },

  rejectRequest: async (requestId: number | string): Promise<{ message: string }> => {
    if (USE_MOCK || isCurrentDemo()) {
      return { message: 'Friend request removed.' };
    }
    const res = await apiClient.post(`/friendships/reject/${requestId}`);
    return res.data;
  },

  getStatus: async (targetUserId: number | string): Promise<{ status: string; friendshipId?: number }> => {
    if (USE_MOCK || isCurrentDemo()) return { status: 'NONE' };
    try {
      const res = await apiClient.get(`/friendships/status/${targetUserId}`);
      return res.data;
    } catch {
      return { status: 'NONE' };
    }
  },
};

// ==========================================
// 6. MESSAGES API
// ==========================================
export const messagesApi = {
  getConversations: async (): Promise<Conversation[]> => {
    if (USE_MOCK || isCurrentDemo()) {
      return [
        {
          partnerId: '2',
          partnerName: 'Sarah Smith',
          partnerUsername: 'sarah_smith',
          partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
          lastMessage: 'Testing the new reactions right now! The blue theme feels so fast 🎉',
          lastMessageTime: new Date(Date.now() - 300000).toISOString(),
          isLastMessageFromMe: false,
          unreadCount: 1,
        },
        {
          partnerId: '4',
          partnerName: 'Emily Rose',
          partnerUsername: 'emily_rose',
          partnerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80',
          lastMessage: 'Thanks Emily! Really appreciate your design feedback 🎨',
          lastMessageTime: new Date(Date.now() - 3600000 * 3).toISOString(),
          isLastMessageFromMe: true,
          unreadCount: 0,
        },
        {
          partnerId: '5',
          partnerName: 'Alex Green',
          partnerUsername: 'alex_green',
          partnerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
          lastMessage: 'See you at the developer meetup tomorrow John!',
          lastMessageTime: new Date(Date.now() - 3600000 * 6).toISOString(),
          isLastMessageFromMe: false,
          unreadCount: 0,
        },
      ];
    }
    try {
      const res = await apiClient.get<Conversation[]>('/messages/conversations');
      return res.data;
    } catch {
      return [
        {
          partnerId: '2',
          partnerName: 'Sarah Smith',
          partnerUsername: 'sarah_smith',
          partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
          lastMessage: 'Testing the new reactions right now! The blue theme feels so fast 🎉',
          lastMessageTime: new Date(Date.now() - 300000).toISOString(),
          isLastMessageFromMe: false,
          unreadCount: 1,
        },
      ];
    }
  },

  getBetween: async (otherUserId: string | number, currentUserId?: string | number): Promise<Message[]> => {
    if (USE_MOCK || isCurrentDemo()) {
      await new Promise((r) => setTimeout(r, 100));
      return mockMessages.filter(
        (m) =>
          (String(m.senderId) === String(currentUserId) && String(m.receiverId) === String(otherUserId)) ||
          (String(m.senderId) === String(otherUserId) && String(m.receiverId) === String(currentUserId))
      );
    }
    const res = await apiClient.get<Message[]>(`/messages?withUserId=${otherUserId}`);
    return res.data;
  },

  send: async (receiverId: string | number, content: string, currentUser: User): Promise<Message> => {
    if (USE_MOCK || isCurrentDemo()) {
      await new Promise((r) => setTimeout(r, 100));
      const newMsg: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        receiverId: String(receiverId),
        senderName: currentUser.fullName,
        content,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      mockMessages.push(newMsg);
      saveLocal();
      return newMsg;
    }
    const res = await apiClient.post<Message>('/messages', { receiverId: Number(receiverId), content });
    return res.data;
  },
};

// ==========================================
// 7. USERS / PROFILE API
// ==========================================
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    if (USE_MOCK || isCurrentDemo()) {
      return mockUsers;
    }
    try {
      const res = await apiClient.get<User[]>('/users');
      return res.data;
    } catch {
      return mockUsers;
    }
  },

  getById: async (id: string): Promise<User | undefined> => {
    if (USE_MOCK || isCurrentDemo()) {
      return mockUsers.find((u) => String(u.id) === String(id) || u.username === id);
    }
    try {
      const res = await apiClient.get<User>(`/users/${id}`);
      return res.data;
    } catch {
      return undefined;
    }
  },

  updateProfile: async (id: string, fullName: string, bio: string, avatarUrl?: string): Promise<User> => {
    if (USE_MOCK || isCurrentDemo()) {
      const user = mockUsers.find((u) => String(u.id) === String(id));
      if (user) {
        user.fullName = fullName;
        user.bio = bio;
        if (avatarUrl) user.avatarUrl = avatarUrl;
        saveLocal();
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      throw new Error('User not found');
    }
    const res = await apiClient.put<User>('/users/profile', { fullName, bio, avatarUrl });
    localStorage.setItem('user', JSON.stringify(res.data));
    return res.data;
  },

  changeProfilePicture: async (currentUser: User, newAvatarUrl: string): Promise<{ updatedUser: User; newPost: Post }> => {
    const updatedUser = await usersApi.updateProfile(
      currentUser.id,
      currentUser.fullName,
      currentUser.bio || '',
      newAvatarUrl
    );

    const postContent = `${currentUser.fullName} updated their profile picture.`;
    const newPost = await postsApi.create(postContent, updatedUser, newAvatarUrl);

    return { updatedUser, newPost };
  },
};

// ==========================================
// 8. SETTINGS & ACCOUNT API
// ==========================================
let mockAdditionalEmails: UserEmailItem[] = [];

export const accountApi = {
  getSettings: async (): Promise<AccountSettingsData> => {
    try {
      const res = await apiClient.get<AccountSettingsData>('/users/account');
      return res.data;
    } catch {
      const user = mockUsers.find((u) => u.id === '1') || mockUsers[0];
      return {
        id: 1,
        username: user.username,
        fullName: user.fullName,
        primaryEmail: user.email,
        isPrimaryEmailVerified: user.isEmailVerified ?? true,
        additionalEmails: mockAdditionalEmails,
      };
    }
  },

  sendEmailOtp: async (email: string): Promise<{ message: string }> => {
    // Always call backend API to send real Gmail SMTP email
    const res = await apiClient.post<{ message: string }>('/users/send-email-otp', { email });
    return res.data;
  },

  verifyEmailOtp: async (email: string, otp: string): Promise<{ message: string; isVerified: boolean }> => {
    // Always call backend API to verify OTP code
    const res = await apiClient.post<{ message: string; isVerified: boolean }>('/users/verify-email-otp', { email, otp });
    return res.data;
  },

  deleteEmail: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/users/emails/${id}`);
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/users/change-password', { currentPassword, newPassword });
    return res.data;
  },
};
