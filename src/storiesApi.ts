import { StoryItem, HighlightItem, User } from './types';

// ==========================================
// 24-HOUR STORIES DATA STORAGE
// ==========================================
const STORIES_STORAGE_KEY = 'opensocial_active_stories';
const HIGHLIGHTS_STORAGE_KEY = 'opensocial_user_highlights';

const INITIAL_STORIES: StoryItem[] = [
  {
    id: 's1',
    authorId: '2',
    authorName: 'Sarah Smith',
    authorUsername: 'sarah_smith',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    text: 'Sunny beach vibes today! 🌊✨',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 21 * 3600000).toISOString(),
    isViewed: false,
  },
  {
    id: 's2',
    authorId: '3',
    authorName: 'David Miller',
    authorUsername: 'david_miller',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    bgGradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    text: 'Building scalable social apps with React & .NET! Code never sleeps 💻⚡',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 19 * 3600000).toISOString(),
    isViewed: false,
  },
  {
    id: 's3',
    authorId: '4',
    authorName: 'Emily Rose',
    authorUsername: 'emily_rose',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    text: 'Productivity coffee session ☕ Working on new designs!',
    createdAt: new Date(Date.now() - 7 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 17 * 3600000).toISOString(),
    isViewed: true,
  },
];

const INITIAL_HIGHLIGHTS: HighlightItem[] = [
  {
    id: 'h1',
    userId: '1',
    title: 'Travel ✈️',
    coverUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'h2',
    userId: '1',
    title: 'Memories 🌟',
    coverUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'h3',
    userId: '1',
    title: 'Tech & Code 💻',
    coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// 1. Stories API
export const storiesApi = {
  getActive: (): StoryItem[] => {
    try {
      const stored = localStorage.getItem(STORIES_STORAGE_KEY);
      const list: StoryItem[] = stored ? JSON.parse(stored) : INITIAL_STORIES;
      // Filter out stories older than 24 hours
      const now = Date.now();
      const active = list.filter((s) => new Date(s.expiresAt).getTime() > now);
      localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(active));
      return active;
    } catch {
      return INITIAL_STORIES;
    }
  },

  create: (
    author: User,
    data: { imageUrl?: string; text?: string; bgGradient?: string }
  ): StoryItem => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
    const newStory: StoryItem = {
      id: `story_${Date.now()}`,
      authorId: String(author.id),
      authorName: author.fullName,
      authorUsername: author.username,
      authorAvatar: author.avatarUrl,
      imageUrl: data.imageUrl,
      text: data.text,
      bgGradient: data.bgGradient,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isViewed: false,
    };

    const current = storiesApi.getActive();
    const updated = [newStory, ...current];
    localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updated));
    return newStory;
  },

  markViewed: (storyId: string) => {
    try {
      const current = storiesApi.getActive();
      const updated = current.map((s) => (s.id === storyId ? { ...s, isViewed: true } : s));
      localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },
};

// 2. Highlights API
export const highlightsApi = {
  getUserHighlights: (userId: string | number): HighlightItem[] => {
    try {
      const stored = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
      const all: HighlightItem[] = stored ? JSON.parse(stored) : INITIAL_HIGHLIGHTS;
      return all.filter((h) => String(h.userId) === String(userId));
    } catch {
      return INITIAL_HIGHLIGHTS.filter((h) => String(h.userId) === String(userId));
    }
  },

  create: (userId: string | number, title: string, coverUrl: string): HighlightItem => {
    const newHighlight: HighlightItem = {
      id: `hl_${Date.now()}`,
      userId: String(userId),
      title: title.trim(),
      coverUrl: coverUrl.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
      const all: HighlightItem[] = stored ? JSON.parse(stored) : INITIAL_HIGHLIGHTS;
      const updated = [...all, newHighlight];
      localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    return newHighlight;
  },

  delete: (highlightId: string) => {
    try {
      const stored = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
      const all: HighlightItem[] = stored ? JSON.parse(stored) : INITIAL_HIGHLIGHTS;
      const updated = all.filter((h) => h.id !== highlightId);
      localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },
};
