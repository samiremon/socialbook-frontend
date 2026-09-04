# Simple ASP.NET Core Backend Guide

This guide lists the simple REST API endpoints needed for your Social Media learning project.

---

## 🗄️ Database Tables (PostgreSQL)

### 1. `Users` Table
- `Id` (string / GUID)
- `FullName` (string)
- `Username` (string)
- `Email` (string)
- `PasswordHash` (string)
- `Bio` (string)
- `AvatarUrl` (string)

### 2. `Posts` Table
- `Id` (string / GUID)
- `AuthorId` (string, Foreign Key to Users)
- `Content` (string)
- `CreatedAt` (DateTime)

### 3. `Comments` Table
- `Id` (string / GUID)
- `PostId` (string, Foreign Key to Posts)
- `AuthorId` (string, Foreign Key to Users)
- `Content` (string)
- `CreatedAt` (DateTime)

### 4. `Messages` Table
- `Id` (string / GUID)
- `SenderId` (string, Foreign Key to Users)
- `ReceiverId` (string, Foreign Key to Users)
- `Content` (string)
- `CreatedAt` (DateTime)

---

## 📡 REST API Endpoints

### 🔐 1. Auth (`/api/auth`)
- `POST /api/auth/register` (body: `{ fullName, username, email, password }`) -> returns `{ token, user }`
- `POST /api/auth/login` (body: `{ emailOrUsername, password }`) -> returns `{ token, user }`

### 📝 2. Posts (`/api/posts`)
- `GET /api/posts` -> returns all posts with comments and author details
- `POST /api/posts` (body: `{ content }`) -> creates a new post
- `DELETE /api/posts/{id}` -> deletes a post

### 💬 3. Comments (`/api/posts/{postId}/comments`)
- `POST /api/posts/{postId}/comments` (body: `{ content }`) -> adds comment to post

### ✉️ 4. Messages (`/api/messages`)
- `GET /api/messages?withUserId={id}` -> returns message history between current user and selected user
- `POST /api/messages` (body: `{ receiverId, content }`) -> sends a message

### 👤 5. Users (`/api/users`)
- `GET /api/users` -> returns all registered users
- `GET /api/users/{id}` -> returns user details
- `PUT /api/users/profile` (body: `{ fullName, bio }`) -> updates current user's profile
