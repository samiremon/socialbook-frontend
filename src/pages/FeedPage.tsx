import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  MessageCircle,
  Sparkles,
  UserPlus,
  Check,
  Flame,
  Compass,
} from 'lucide-react';
import { Post, FriendUser, FriendRequest } from '../types';
import { postsApi, friendshipsApi } from '../api';
import { CreatePost } from '../components/CreatePost';
import { PostCard } from '../components/PostCard';
import { StoriesBar } from '../components/StoriesBar';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [feedFilter, setFeedFilter] = useState<'all' | 'my'>('all');

  // Sidebar widgets data
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [sentUserIds, setSentUserIds] = useState<Set<string | number>>(new Set());

  const loadFeedData = async () => {
    try {
      const data = await postsApi.getAll();
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadWidgetsData = async () => {
    if (!user) return;
    try {
      const [sugg, reqs, frnds] = await Promise.all([
        friendshipsApi.getSuggestions(),
        friendshipsApi.getRequests(),
        friendshipsApi.getFriends(),
      ]);
      setSuggestions(sugg.slice(0, 5));
      setPendingRequests(reqs.slice(0, 3));
      setFriends(frnds);
    } catch (err) {
      console.warn('Silent widgets load failed', err);
    }
  };

  useEffect(() => {
    loadFeedData();
    loadWidgetsData();
  }, [user]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));
  };

  const handlePostShared = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleQuickAddFriend = async (targetUserId: string | number) => {
    if (user?.isDemo) {
      toast.showErrorModal(
        'Demo Account Restricted',
        'You are currently using the demo account (John Doe). Sending friend requests is disabled for demo visitors. Please register or sign in with your own account!',
        'Sign In / Register',
        () => navigate('/login')
      );
      return;
    }
    try {
      setSentUserIds((prev) => new Set(prev).add(targetUserId));
      await friendshipsApi.sendRequest(targetUserId);
      toast.success('Friend request sent!');
    } catch {
      toast.error('Failed to send request');
      setSentUserIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const handleQuickAcceptRequest = async (requestId: number, requesterName: string) => {
    if (user?.isDemo) {
      toast.showErrorModal(
        'Demo Account Restricted',
        'Accepting friend requests is disabled for demo visitors. Please register or sign in with your own account!',
        'Sign In / Register',
        () => navigate('/login')
      );
      return;
    }
    try {
      await friendshipsApi.acceptRequest(requestId);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success(`Connected with ${requesterName}`);
      loadWidgetsData();
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const filteredPosts =
    feedFilter === 'my' && user
      ? posts.filter((p) => String(p.authorId) === String(user.id))
      : posts;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Profile Snapshot & Navigation Sidebar (3 cols) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-20 space-y-4">
            {/* User Profile Card */}
            {user ? (
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-4 shadow-xs">
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  <img
                    src={
                      user.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                    }
                    alt={user.fullName}
                    className="w-12 h-12 rounded-full border-2 border-brand-500 object-cover shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-[#e4e6eb] text-sm truncate leading-tight">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-[#b0b3b8] truncate">@{user.username}</p>
                    <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 inline-block mt-0.5">
                      View your profile →
                    </span>
                  </div>
                </Link>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-[#393a3b] text-center">
                  <div className="bg-slate-50 dark:bg-[#3a3b3c] p-2 rounded-xl">
                    <p className="text-xs text-slate-400 dark:text-[#b0b3b8]">Friends</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-[#e4e6eb]">{friends.length}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#3a3b3c] p-2 rounded-xl">
                    <p className="text-xs text-slate-400 dark:text-[#b0b3b8]">Posts</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-[#e4e6eb]">
                      {posts.filter((p) => String(p.authorId) === String(user.id)).length}
                    </p>
                  </div>
                </div>

                {/* Demo Mode Alert Banner */}
                {user.isDemo && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-[#3a3b3c] border border-amber-200 dark:border-amber-800/60 text-center">
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-1 flex items-center justify-center gap-1">
                        <span>⚡</span> Demo Account Active
                      </p>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mb-2.5 leading-tight">
                        Sign in or register to publish posts, send friend requests and chat!
                      </p>
                      <Link
                        to="/login"
                        className="block w-full py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        Log In / Sign Up →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-5 shadow-xs text-center">
                <p className="font-bold text-slate-800 dark:text-[#e4e6eb] text-sm mb-1">Welcome to OpenSocial</p>
                <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mb-4">
                  Log in to interact with posts, make friends, and chat.
                </p>
                <Link
                  to="/login"
                  className="block w-full py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Quick Navigation Links */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-2.5 shadow-xs space-y-1">
              <button
                onClick={() => setFeedFilter('all')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  feedFilter === 'all'
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold'
                    : 'text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#3a3b3c]'
                }`}
              >
                <Compass className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>News Feed</span>
              </button>

              {user && (
                <button
                  onClick={() => setFeedFilter('my')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                    feedFilter === 'my'
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold'
                      : 'text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#3a3b3c]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>My Posts</span>
                </button>
              )}

              <Link
                to="/friends"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Friends & Requests</span>
                </div>
                {pendingRequests.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {pendingRequests.length}
                  </span>
                )}
              </Link>

              <Link
                to="/messages"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Messenger</span>
              </Link>
            </div>

            {/* Footer / Info */}
            <div className="px-3 text-[11px] text-slate-400 dark:text-[#b0b3b8]/70 space-y-1">
              <p>© 2026 OpenSocial • Built with ASP.NET & React</p>
              <p>Facebook-like reactions, notifications & friends</p>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: Main Feed (6 cols on lg) */}
        <main className="lg:col-span-6 space-y-4">
          {/* 24-Hour Stories Bar */}
          <StoriesBar />

          {/* Post Composer */}
          <CreatePost onPostCreated={handlePostCreated} />

          {/* Feed Filter Buttons */}
          <div className="flex items-center justify-between bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] px-4 py-2.5 shadow-xs">
            <span className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              {feedFilter === 'all' ? 'All Community Posts' : 'My Posts Only'}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  feedFilter === 'all'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c]'
                }`}
              >
                All
              </button>
              {user && (
                <button
                  onClick={() => setFeedFilter('my')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    feedFilter === 'my'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-500 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c]'
                  }`}
                >
                  My Posts
                </button>
              )}
            </div>
          </div>

          {/* Posts List */}
          {loadingPosts ? (
            <div className="bg-white dark:bg-[#242526] rounded-2xl p-12 text-center text-slate-400 dark:text-[#b0b3b8] text-xs border border-slate-200 dark:border-[#393a3b]">
              Loading posts...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-10 text-center text-slate-500 dark:text-[#b0b3b8] text-xs">
              <Sparkles className="w-8 h-8 text-brand-400 mx-auto mb-2" />
              No posts found in this feed view. Be the first to share your thoughts above!
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={handlePostDeleted}
                onPostShared={handlePostShared}
              />
            ))
          )}
        </main>

        {/* RIGHT COLUMN: People You May Know & Friend Requests (3 cols) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-20 space-y-4">
            {/* Pending Friend Requests Widget */}
            {pendingRequests.length > 0 && (
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#393a3b] pb-2">
                  <h3 className="font-bold text-xs text-slate-800 dark:text-[#e4e6eb] flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Friend Requests
                  </h3>
                  <Link
                    to="/friends"
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    See all
                  </Link>
                </div>

                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-start gap-2.5">
                      <Link to={`/profile/${req.requesterId}`}>
                        <img
                          src={
                            req.requesterAvatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requesterUsername}`
                          }
                          alt={req.requesterName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#393a3b] mt-0.5"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/profile/${req.requesterId}`}
                          className="font-bold text-xs text-slate-900 dark:text-[#e4e6eb] hover:text-brand-600 dark:hover:text-brand-400 truncate block"
                        >
                          {req.requesterName}
                        </Link>
                        <p className="text-[11px] text-slate-400 dark:text-[#b0b3b8] truncate">
                          @{req.requesterUsername}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAcceptRequest(req.id, req.requesterName)}
                            className="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => friendshipsApi.rejectRequest(req.id)}
                            className="bg-slate-100 dark:bg-[#3a3b3c] hover:bg-slate-200 dark:hover:bg-[#4e4f50] text-slate-700 dark:text-[#e4e6eb] text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* People You May Know Widget */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#393a3b] pb-2">
                <h3 className="font-bold text-xs text-slate-800 dark:text-[#e4e6eb] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  People You May Know
                </h3>
                <Link
                  to="/friends"
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  See all
                </Link>
              </div>

              {suggestions.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-[#b0b3b8] py-3 text-center">
                  No new suggestions at this moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((person) => {
                    const isSent = sentUserIds.has(person.id);
                    return (
                      <div key={person.id} className="flex items-center justify-between gap-2">
                        <Link
                          to={`/profile/${person.id}`}
                          className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90"
                        >
                          <img
                            src={
                              person.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`
                            }
                            alt={person.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#393a3b] shrink-0"
                          />
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-800 dark:text-[#e4e6eb] truncate leading-tight">
                              {person.fullName}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-[#b0b3b8] truncate">
                              @{person.username}
                            </p>
                          </div>
                        </Link>

                        {isSent ? (
                          <span className="text-[10px] text-slate-400 dark:text-[#b0b3b8] font-semibold flex items-center gap-0.5 shrink-0">
                            <Check className="w-3 h-3 text-brand-600 dark:text-brand-400" /> Sent
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickAddFriend(person.id)}
                            className="shrink-0 flex items-center gap-1 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors"
                          >
                            <UserPlus className="w-3 h-3" />
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Contacts List */}
            {friends.length > 0 && (
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#393a3b] pb-2">
                  <h3 className="font-bold text-xs text-slate-800 dark:text-[#e4e6eb] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Contacts ({friends.length})
                  </h3>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => navigate(`/messages?user=${f.id}`)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors text-left"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={
                            f.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`
                          }
                          alt={f.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-[#393a3b]"
                        />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#242526]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-800 dark:text-[#e4e6eb] truncate leading-tight">
                          {f.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-[#b0b3b8] truncate">@{f.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
