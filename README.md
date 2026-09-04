# Pulse | Modern Full-Stack Social Network Frontend

A modern, responsive, and feature-rich Social Network frontend built with **React 19 + TypeScript + Vite + Tailwind CSS + React Router + Axios**.

---

## 🚀 Quick Start

### 1. Install & Run Dev Server
```bash
cd frontend
npm install
npm run dev
```

Your app will run at `http://localhost:3000`.

---

## ⚡ Features Built & Included

1. **User Profiles & Discovery:**
   - Profile view (`/profile/:username` and `/profile`)
   - Cover banner & avatar
   - Bio, website link, location, joined timestamp, follower & following counts
   - Edit Profile Modal (`UpdateProfileRequest`)
   - Follow & Unfollow creators with instant optimistic feedback

2. **News Feed & Timeline:**
   - Filter feeds by **For You**, **Trending**, or **Latest**
   - Rich post creation with text, character limits, image URL previews, and tags (`#dotnet`, `#react`, etc.)
   - Like & unlike posts with optimistic UI updates
   - Share post link with 1-click clipboard copy
   - Delete own posts

3. **Comments System:**
   - Real-time discussion thread underneath every post
   - Add new comments with validation
   - Like comments
   - Delete own comments

4. **Direct Messaging (Chat):**
   - Inbox with conversation list & search filter (`/messages`)
   - Direct chatting with participant avatars, online indicators, and read receipts
   - Instant messaging state with auto-scrolling message streams

5. **Explore & Search:**
   - Search creators, keywords, and topics (`/explore`)
   - Filter by technology tags (`#dotnet`, `#csharp`, `#postgres`, `#react`, etc.)

6. **Authentication & Authorization:**
   - Sign In (`/login`) with demo 1-click prefill helper
   - Sign Up (`/register`) with real-time form validations
   - Protected routes (`ProtectedRoute.tsx`)
   - JWT storage in `localStorage` and automatic Axios Bearer token attachment

7. **Backend Ready (ASP.NET Core REST API):**
   - Configured with `AxiosClient` interceptors for standard `http://localhost:5000/api`
   - Includes full [BACKEND_API_GUIDE.md](file:///E:/emon%20brac/Learn/dotnet%20project/frontend/BACKEND_API_GUIDE.md) documenting the exact C# DTOs, controllers, and PostgreSQL schema.
   - Built-in `VITE_USE_MOCK_API=true` toggle in `.env` so you can test all features immediately in your browser before or while developing your .NET backend.

---

## 📂 Project Architecture

```
frontend/
├── BACKEND_API_GUIDE.md        # Complete ASP.NET Core & PostgreSQL contract
├── .env                         # API base URL & mock toggle
├── src/
│   ├── api/                     # Axios instance & API services
│   │   ├── axiosClient.ts       # JWT interceptor & base URL
│   │   ├── authApi.ts           # Login, register, me
│   │   ├── postsApi.ts          # Posts, feed, likes, delete
│   │   ├── commentsApi.ts       # Post comments
│   │   ├── profileApi.ts        # Profiles, update, follows
│   │   ├── messagesApi.ts       # Direct messages & conversations
│   │   └── mockData.ts          # Interactive mock store
│   ├── types/                   # TypeScript interfaces & DTOs
│   ├── context/                 # AuthContext & NotificationContext
│   ├── components/
│   │   ├── common/              # Navbar, Sidebar, RightSidebar, Button, Input, Modal, Avatar
│   │   ├── feed/                # CreatePostCard, PostCard, CommentSection
│   │   ├── profile/             # ProfileHeader, EditProfileModal
│   │   ├── messages/            # ConversationList, ChatWindow, MessageBubble
│   │   └── layout/              # MainLayout (3-column responsive)
│   ├── pages/                   # Feed, Profile, Messages, PostDetail, Explore, Login, Register
│   ├── routes/                  # AppRoutes & ProtectedRoute
│   ├── App.tsx
│   └── main.tsx
```
