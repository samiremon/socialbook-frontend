import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
  Search,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { friendshipsApi } from '../api';
import { FriendRequest, FriendUser } from '../types';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'requests' | 'friends'>('suggestions');
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep track of pending sent user IDs for immediate UI updates
  const [sentUserIds, setSentUserIds] = useState<Set<string | number>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const [suggData, reqData, friendData] = await Promise.all([
        friendshipsApi.getSuggestions(),
        friendshipsApi.getRequests(),
        friendshipsApi.getFriends(),
      ]);
      setSuggestions(suggData);
      setRequests(reqData);
      setFriends(friendData);
    } catch (err) {
      console.error('Failed to load friends data', err);
      toast.error('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleSendRequest = async (targetUserId: string | number) => {
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
    } catch (err: any) {
      toast.showErrorModal(
        'Friend Request Error',
        err.response?.data?.message || 'Failed to send friend request. Please try logging in with a registered account.',
        'Go to Login',
        () => navigate('/login')
      );
      setSentUserIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const handleAcceptRequest = async (requestId: number, requesterName: string) => {
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
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success(`You and ${requesterName} are now friends!`);
      // Reload friends
      const updatedFriends = await friendshipsApi.getFriends();
      setFriends(updatedFriends);
    } catch (err: any) {
      toast.showErrorModal(
        'Friend Request Error',
        err.response?.data?.message || 'Failed to accept friend request.'
      );
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (user?.isDemo) {
      toast.showErrorModal(
        'Demo Account Restricted',
        'Rejecting friend requests is disabled in demo mode.',
        'Sign In / Register',
        () => navigate('/login')
      );
      return;
    }

    try {
      await friendshipsApi.rejectRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.info('Friend request removed');
    } catch (err) {
      toast.error('Failed to remove request');
    }
  };

  const handleUnfriend = async (friendshipId: number | undefined, friendName: string) => {
    if (!friendshipId) return;
    if (!window.confirm(`Unfriend ${friendName}?`)) return;
    try {
      await friendshipsApi.rejectRequest(friendshipId);
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
      toast.info(`Unfriended ${friendName}`);
    } catch (err) {
      toast.error('Failed to unfriend');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-slate-600">
        Please log in to manage your friends.
      </div>
    );
  }

  // Filtering
  const filteredSuggestions = suggestions.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 border border-slate-200/80 dark:border-[#393a3b] shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-[#e4e6eb] flex items-center gap-2.5">
              <Users className="w-7 h-7 text-brand-600 dark:text-brand-400" />
              Friends Hub
            </h1>
            <p className="text-slate-500 dark:text-[#b0b3b8] text-xs mt-1">
              Connect with people you know, manage incoming requests, and chat with friends.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#b0b3b8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people or friends..."
              className="w-full bg-slate-100 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] pl-9 pr-4 py-2 rounded-full text-xs border border-transparent focus:border-brand-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Tab Navigation with bottom green indicator */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 dark:border-[#393a3b] pb-2">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'suggestions'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                : 'text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            People You May Know ({suggestions.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'requests'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                : 'text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Friend Requests
            {requests.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'requests'
                    ? 'bg-white text-brand-700'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'friends'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                : 'text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            All Friends ({friends.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-12 text-center text-slate-400 dark:text-[#b0b3b8] text-sm border border-slate-200 dark:border-[#393a3b]">
          Loading friends data...
        </div>
      ) : (
        <>
          {/* TAB 1: People You May Know */}
          {activeTab === 'suggestions' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 dark:text-[#e4e6eb]">
                  People You May Know on OpenSocial
                </h2>
                <span className="text-xs text-slate-400 dark:text-[#b0b3b8]">
                  {filteredSuggestions.length} suggestions available
                </span>
              </div>

              {filteredSuggestions.length === 0 ? (
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-12 text-center border border-slate-200 dark:border-[#393a3b] text-slate-500 dark:text-[#b0b3b8] text-sm">
                  No suggestions available right now. Check back soon!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredSuggestions.map((person) => {
                    const isSent = sentUserIds.has(person.id);
                    return (
                      <div
                        key={person.id}
                        className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-4 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow"
                      >
                        <Link to={`/profile/${person.id}`}>
                          <img
                            src={
                              person.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`
                            }
                            alt={person.fullName}
                            className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-[#393a3b] mb-3 hover:scale-105 transition-transform"
                          />
                        </Link>
                        <Link
                          to={`/profile/${person.id}`}
                          className="font-bold text-sm text-slate-900 dark:text-[#e4e6eb] hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                        >
                          {person.fullName}
                        </Link>
                        <p className="text-xs text-slate-400 dark:text-[#b0b3b8] mb-2">@{person.username}</p>
                        <p className="text-xs text-slate-600 dark:text-[#b0b3b8] line-clamp-2 mb-4 h-8">
                          {person.bio || 'Member of OpenSocial community'}
                        </p>

                        <div className="w-full mt-auto">
                          {isSent ? (
                            <button
                              disabled
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#3a3b3c] text-slate-500 dark:text-[#b0b3b8] cursor-default"
                            >
                              <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                              Request Sent
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendRequest(person.id)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-sm shadow-brand-600/20"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Add Friend
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Friend Requests */}
          {activeTab === 'requests' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 dark:text-[#e4e6eb]">
                  Friend Requests ({requests.length})
                </h2>
              </div>

              {requests.length === 0 ? (
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-12 text-center border border-slate-200 dark:border-[#393a3b] text-slate-500 dark:text-[#b0b3b8] text-sm">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  No pending friend requests.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-4 flex flex-col items-center text-center shadow-xs"
                    >
                      <Link to={`/profile/${req.requesterId}`}>
                        <img
                          src={
                            req.requesterAvatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requesterUsername}`
                          }
                          alt={req.requesterName}
                          className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-[#393a3b] mb-3"
                        />
                      </Link>
                      <Link
                        to={`/profile/${req.requesterId}`}
                        className="font-bold text-sm text-slate-900 dark:text-[#e4e6eb] hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                      >
                        {req.requesterName}
                      </Link>
                      <p className="text-xs text-slate-400 dark:text-[#b0b3b8] mb-4">@{req.requesterUsername}</p>

                      <div className="w-full flex flex-col gap-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(req.id, req.requesterName)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-sm shadow-brand-600/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(req.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#3a3b3c] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-[#e4e6eb] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: All Friends */}
          {activeTab === 'friends' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 dark:text-[#e4e6eb]">
                  Your Friends ({filteredFriends.length})
                </h2>
              </div>

              {filteredFriends.length === 0 ? (
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-12 text-center border border-slate-200 dark:border-[#393a3b] text-slate-500 dark:text-[#b0b3b8] text-sm">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  No friends added yet. Go to "People You May Know" to connect!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-4 flex flex-col items-center text-center shadow-xs"
                    >
                      <Link to={`/profile/${friend.id}`}>
                        <img
                          src={
                            friend.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`
                          }
                          alt={friend.fullName}
                          className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-[#393a3b] mb-3 hover:scale-105 transition-transform"
                        />
                      </Link>
                      <Link
                        to={`/profile/${friend.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-[#e4e6eb] hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                      >
                        {friend.fullName}
                      </Link>
                      <p className="text-xs text-slate-400 dark:text-[#b0b3b8] mb-4">@{friend.username}</p>

                      <div className="w-full flex flex-col gap-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => navigate(`/messages?user=${friend.id}`)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Message
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnfriend(friend.friendshipId, friend.fullName)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-medium text-slate-400 dark:text-[#b0b3b8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <UserX className="w-3 h-3" />
                          Unfriend
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
