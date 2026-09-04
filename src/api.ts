import axios from 'axios';
import { User, Post, Comment, Message, Liker } from './types';

// Base Axios instance pointing to your .NET backend
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'; // defaults to true for easy preview
const USE_MOCK = false;
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
// MOCK DATA (For instant local testing)
// ==========================================
let mockUsers: User[] = [
  {
    id: '1',
    username: 'john_doe',
    fullName: 'John Doe',
    email: 'john@example.com',
    bio: 'Software learner building with C# & React!',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    username: 'sarah_smith',
    fullName: 'Sarah Smith',
    email: 'sarah@example.com',
    bio: 'Tech enthusiast & developer.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  },
];

let mockPosts: Post[] = [
  {
    id: '101',
    authorId: '2',
    authorName: 'Sarah Smith',
    authorUsername: 'sarah_smith',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    content: 'Hello everyone! Welcome to our simple social media app built with .NET and React!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    comments: [
      {
        id: 'c1',
        postId: '101',
        authorId: '1',
        authorName: 'John Doe',
        content: 'Great to be here! Excited to learn.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
];

let mockMessages: Message[] = [
  {
    id: 'm1',
    senderId: '2',
    receiverId: '1',
    senderName: 'Sarah Smith',
    content: 'Hi John, how is your .NET project going?',
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

// Load from browser memory if available
const savedPosts = localStorage.getItem('app_posts');
if (savedPosts) {
  try { mockPosts = JSON.parse(savedPosts); } catch {}
}
const savedUsers = localStorage.getItem('app_users');
if (savedUsers) {
  try { mockUsers = JSON.parse(savedUsers); } catch {}
}
const savedMessages = localStorage.getItem('app_messages');
if (savedMessages) {
  try { mockMessages = JSON.parse(savedMessages); } catch {}
}

const saveLocal = () => {
  localStorage.setItem('app_posts', JSON.stringify(mockPosts));
  localStorage.setItem('app_users', JSON.stringify(mockUsers));
  localStorage.setItem('app_messages', JSON.stringify(mockMessages));
};

// ==========================================
// SIMPLE API METHODS
// ==========================================

// 1. Auth API
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
        bio: 'Hello! I just joined.',
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80`,
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
};

// 2. Posts API (Feed, Create, Delete)
export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      return [...mockPosts].reverse();
    }
    const res = await apiClient.get<Post[]>('/posts');
    return res.data;
  },

  create: async (content: string, currentUser: User, imageUrl?: string): Promise<Post> => {
    if (USE_MOCK) {
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
        comments: [],
      };
      mockPosts.push(newPost);
      saveLocal();
      return newPost;
    }
    const res = await apiClient.post<Post>('/posts', { content, imageUrl });
    return res.data;
  },

  delete: async (postId: string): Promise<void> => {
    if (USE_MOCK) {
      mockPosts = mockPosts.filter((p) => p.id !== postId);
      saveLocal();
      return;
    }
    await apiClient.delete(`/posts/${postId}`);
  },

  toggleLike: async (postId: string | number): Promise<{ isLiked: boolean; likesCount: number; likers: Liker[] }> => {
    if (USE_MOCK) {
      const p = mockPosts.find((item) => String(item.id) === String(postId));
      if (p) {
        p.isLikedByCurrentUser = !p.isLikedByCurrentUser;
        p.likesCount = (p.likesCount || 0) + (p.isLikedByCurrentUser ? 1 : -1);
        saveLocal();
        return { isLiked: p.isLikedByCurrentUser, likesCount: p.likesCount, likers: p.likers || [] };
      }
      return { isLiked: false, likesCount: 0, likers: [] };
    }
    const res = await apiClient.post<{ isLiked: boolean; likesCount: number; likers: Liker[] }>(`/posts/${postId}/like`);
    return res.data;
  },

  getLikers: async (postId: string | number): Promise<Liker[]> => {
    if (USE_MOCK) {
      const p = mockPosts.find((item) => String(item.id) === String(postId));
      return p?.likers || [];
    }
    const res = await apiClient.get<Liker[]>(`/posts/${postId}/likes`);
    return res.data;
  },
};

// 3. Comments API
export const commentsApi = {
  add: async (postId: string | number, content: string, currentUser: User): Promise<Comment> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      const newComment: Comment = {
        id: Date.now().toString(),
        postId: String(postId),
        authorId: currentUser.id,
        authorName: currentUser.fullName,
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

// 4. Messages API
export const messagesApi = {
  getRecent: async (): Promise<number[]> => {
    if (USE_MOCK) return [];
    try {
      const res = await apiClient.get<number[]>('/messages/recent');
      return res.data;
    } catch {
      return [];
    }
  },

  getBetween: async (otherUserId: string | number, currentUserId: string | number): Promise<Message[]> => {
    if (USE_MOCK) {
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

  send: async (receiverId: string, content: string, currentUser: User): Promise<Message> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 100));
      const newMsg: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        receiverId,
        senderName: currentUser.fullName,
        content,
        createdAt: new Date().toISOString(),
      };
      mockMessages.push(newMsg);
      saveLocal();
      return newMsg;
    }
    const res = await apiClient.post<Message>('/messages', { receiverId, content });
    return res.data;
  },
};

// 5. Users / Profile API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    if (USE_MOCK) {
      return mockUsers;
    }
    const res = await apiClient.get<User[]>('/users');
    return res.data;
  },

  getById: async (id: string): Promise<User | undefined> => {
    if (USE_MOCK) {
      return mockUsers.find((u) => u.id === id || u.username === id);
    }
    const res = await apiClient.get<User>(`/users/${id}`);
    return res.data;
  },

  updateProfile: async (id: string, fullName: string, bio: string, avatarUrl?: string): Promise<User> => {
    if (USE_MOCK) {
      const user = mockUsers.find((u) => u.id === id);
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

  // Updates profile picture and automatically creates a post on the feed
  changeProfilePicture: async (currentUser: User, newAvatarUrl: string): Promise<{ updatedUser: User; newPost: Post }> => {
    // 1. Update user avatar
    const updatedUser = await usersApi.updateProfile(
      currentUser.id,
      currentUser.fullName,
      currentUser.bio || '',
      newAvatarUrl
    );

    // 2. Automatically create a post announcing the new profile picture
    const postContent = `${currentUser.fullName} updated their profile picture.`;
    const newPost = await postsApi.create(postContent, updatedUser, newAvatarUrl);

    return { updatedUser, newPost };
  },
};
