import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  MessageCircle,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  CheckCheck,
  Heart,
  MessageSquare,
  UserPlus,
  Share2,
  Settings,
  Moon,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { notificationsApi, friendshipsApi, messagesApi } from '../api';
import { NotificationItem } from '../types';
import { useToast } from '../ToastContext';
import logoImg from '../assets/lohgo.png';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isActiveStatus, setIsActiveStatus] = useState<boolean>(() => {
    return localStorage.getItem('opensocial_active_status') !== 'false';
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Toggle active status
  const handleToggleActiveStatus = () => {
    const nextStatus = !isActiveStatus;
    setIsActiveStatus(nextStatus);
    localStorage.setItem('opensocial_active_status', String(nextStatus));
    toast.info(nextStatus ? 'You are now appearing Active 🟢' : 'Active status turned off ⚪');
  };

  // Poll for notifications, friend requests, and unread messages every 8s
  const fetchCounts = async () => {
    if (!user) return;
    try {
      const notifData = await notificationsApi.getAll();
      setNotifications(notifData.notifications);
      setUnreadNotifCount(notifData.unreadCount);

      const reqs = await friendshipsApi.getRequests();
      setPendingFriendRequestsCount(reqs.length);

      const convos = await messagesApi.getConversations();
      const totalUnread = convos.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      setUnreadMessagesCount(totalUnread);
    } catch (err) {
      console.warn('Silent count polling error', err);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await notificationsApi.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    }
    setShowNotifMenu(false);

    if (item.type === 'MESSAGE') {
      navigate(`/messages?user=${item.actorId}`);
    } else if (item.type === 'FRIEND_REQUEST' || item.type === 'FRIEND_ACCEPT') {
      navigate('/friends');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const renderNotifIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case 'COMMENT':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />;
      case 'FRIEND_REQUEST':
      case 'FRIEND_ACCEPT':
        return <UserPlus className="w-3.5 h-3.5 text-brand-600" />;
      case 'SHARE':
        return <Share2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'MESSAGE':
        return <MessageCircle className="w-3.5 h-3.5 text-brand-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-brand-600" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className="bg-white dark:bg-[#242526] text-slate-800 dark:text-[#e4e6eb] shadow-xs border-b border-slate-200/80 dark:border-[#393a3b] sticky top-0 z-50 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* LEFT: Logo & Search */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-black text-lg tracking-tight text-brand-700 hover:opacity-95 transition-opacity"
          >
            <img
              src={logoImg}
              alt="OpenSocial Logo"
              className="w-9 h-9 object-contain drop-shadow-xs"
            />
            <span className="hidden sm:inline font-black bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              OpenSocial
            </span>
          </Link>

          {/* Search bar (only when not on login/register page) */}
          {!isAuthPage && (
            <div className="relative hidden md:flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#b0b3b8] absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search OpenSocial..."
                className="bg-slate-100 dark:bg-[#3a3b3c] hover:bg-slate-200/70 dark:hover:bg-[#4e4f50] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb] placeholder-slate-400 dark:placeholder-[#b0b3b8] pl-8 pr-3 py-1.5 rounded-full text-xs w-44 lg:w-60 border border-transparent focus:border-brand-500 focus:outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* CENTER: Main Tabs with Compact Icons & Green Bottom Line */}
        {user && !isAuthPage && (
          <nav className="flex items-center h-full gap-1 sm:gap-2">
            {/* Feed / Home */}
            <Link
              to="/"
              title="Feed"
              className={`h-full px-5 sm:px-7 flex items-center justify-center relative transition-colors ${
                isActive('/')
                  ? 'text-brand-600 border-b-4 border-brand-600 font-semibold'
                  : 'text-slate-500 dark:text-[#b0b3b8] hover:bg-slate-100/70 dark:hover:bg-[#3a3b3c] hover:text-slate-900 dark:hover:text-[#e4e6eb] border-b-4 border-transparent'
              }`}
            >
              <Home className="w-5 h-5" />
            </Link>

            {/* Friends */}
            <Link
              to="/friends"
              title="Friends & Requests"
              className={`h-full px-5 sm:px-7 flex items-center justify-center relative transition-colors ${
                isActive('/friends')
                  ? 'text-brand-600 border-b-4 border-brand-600 font-semibold'
                  : 'text-slate-500 dark:text-[#b0b3b8] hover:bg-slate-100/70 dark:hover:bg-[#3a3b3c] hover:text-slate-900 dark:hover:text-[#e4e6eb] border-b-4 border-transparent'
              }`}
            >
              <Users className="w-5 h-5" />
              {pendingFriendRequestsCount > 0 && (
                <span className="absolute top-2 right-2.5 sm:right-4 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-white dark:ring-[#242526]">
                  {pendingFriendRequestsCount}
                </span>
              )}
            </Link>

            {/* Messages */}
            <Link
              to="/messages"
              title="Messages"
              className={`h-full px-5 sm:px-7 flex items-center justify-center relative transition-colors ${
                isActive('/messages')
                  ? 'text-brand-600 border-b-4 border-brand-600 font-semibold'
                  : 'text-slate-500 dark:text-[#b0b3b8] hover:bg-slate-100/70 dark:hover:bg-[#3a3b3c] hover:text-slate-900 dark:hover:text-[#e4e6eb] border-b-4 border-transparent'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-2 right-2.5 sm:right-4 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-white dark:ring-[#242526]">
                  {unreadMessagesCount}
                </span>
              )}
            </Link>
          </nav>
        )}

        {/* RIGHT: Active Status, Notifications & Profile Dropdown */}
        <div className="flex items-center gap-2">
          {/* On Login / Register pages: clean professional navbar with Dark Mode toggle and links */}
          {isAuthPage ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-200 dark:hover:bg-[#4e4f50] transition-colors"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <Moon className="w-4 h-4" />
              </button>
              {location.pathname === '/login' ? (
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-brand-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-brand-700 transition-colors shadow-xs"
                >
                  Create Account
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="text-xs font-semibold text-brand-700 dark:text-brand-400 px-3.5 py-1.5 rounded-xl hover:bg-brand-50 dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          ) : user ? (
            <>
              {/* Active Status Badge Pill */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-[#3a3b3c] border border-slate-200/70 dark:border-[#4e4f50] rounded-full text-[11px] font-semibold text-slate-600 dark:text-[#e4e6eb]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActiveStatus ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-500'
                  }`}
                />
                <span>{isActiveStatus ? 'Active' : 'Offline'}</span>
              </div>

              {/* Notifications Bell Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative ${
                    showNotifMenu || unreadNotifCount > 0
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50'
                      : 'bg-slate-100 dark:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-200 dark:hover:bg-[#4e4f50]'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#242526]">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#393a3b] overflow-hidden z-50 animate-popIn">
                    <div className="p-3.5 border-b border-slate-100 dark:border-[#393a3b] flex items-center justify-between bg-slate-50/70 dark:bg-[#18191a]/70">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-[#e4e6eb] text-xs">Notifications</h3>
                        {unreadNotifCount > 0 && (
                          <span className="bg-brand-100 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-[#393a3b]">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 dark:text-[#b0b3b8] text-xs">
                          <Bell className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-1" />
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-3 flex items-start gap-2.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-[#3a3b3c] ${
                              !item.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                            }`}
                          >
                            <div className="relative shrink-0">
                              <img
                                src={
                                  item.actorAvatar ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.actorUsername || 'user'}`
                                }
                                alt={item.actorName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#393a3b]"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#242526] rounded-full p-0.5 shadow-xs border border-slate-100 dark:border-[#393a3b]">
                                {renderNotifIcon(item.type)}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs leading-snug ${
                                  !item.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-[#e4e6eb]'
                                }`}
                              >
                                {item.content}
                              </p>
                              <span className="text-[10px] text-slate-400 dark:text-[#b0b3b8] mt-0.5 block">
                                {formatTime(item.createdAt)}
                              </span>
                            </div>

                            {!item.isRead && (
                              <div className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-100 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-center">
                      <Link
                        to="/friends"
                        onClick={() => setShowNotifMenu(false)}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold"
                      >
                        Manage Friend Requests &amp; Activity
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown with Active Status */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  <div className="relative">
                    <img
                      src={
                        user.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                      }
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-brand-500 shadow-xs"
                    />
                    {isActiveStatus && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#242526]" />
                    )}
                  </div>
                  <span className="hidden lg:inline text-xs font-bold text-slate-800 dark:text-[#e4e6eb] pr-1">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#393a3b] overflow-hidden z-50 animate-popIn">
                    {/* User info card */}
                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setShowProfileMenu(false)}
                      className="p-3.5 border-b border-slate-100 dark:border-[#393a3b] flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors"
                    >
                      <div className="relative">
                        <img
                          src={
                            user.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                          }
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-[#393a3b]"
                        />
                        {isActiveStatus && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#242526]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb] truncate">{user.fullName}</p>
                        <p className="text-[11px] text-slate-400 dark:text-[#b0b3b8] truncate">@{user.username}</p>
                        <span className="inline-block mt-0.5 text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                          View profile →
                        </span>
                      </div>
                    </Link>

                    {/* Demo Mode Notice Banner inside Profile Menu */}
                    {user.isDemo && (
                      <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-[#242526] border-b border-amber-200/80 dark:border-amber-800/50">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1">
                            <span>⚡</span> Demo Account Mode
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-full">
                            Guest
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mb-2 leading-tight">
                          You are currently using the demo account. Sign in to post, comment and connect!
                        </p>
                        <Link
                          to="/login"
                          onClick={() => setShowProfileMenu(false)}
                          className="block w-full py-1.5 px-3 text-center bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                          Log In / Sign Up with Real Account →
                        </Link>
                      </div>
                    )}

                    {/* Active Status Control inside Menu */}
                    <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#18191a] border-b border-slate-100 dark:border-[#393a3b] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isActiveStatus ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-500'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb]">Active Status</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleActiveStatus}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                          isActiveStatus
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {isActiveStatus ? 'Active 🟢' : 'Off ⚪'}
                      </button>
                    </div>

                    {/* Navigation Links inside Profile Menu */}
                    <div className="p-1.5 text-xs text-slate-700 dark:text-[#e4e6eb]">
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        My Profile
                      </Link>
                      <Link
                        to="/friends"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
                      >
                        <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        Friends &amp; Requests
                        {pendingFriendRequestsCount > 0 && (
                          <span className="ml-auto bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                            {pendingFriendRequestsCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        Messenger
                        {unreadMessagesCount > 0 && (
                          <span className="ml-auto bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                            {unreadMessagesCount}
                          </span>
                        )}
                      </Link>

                      {/* Facebook-style Dark Mode Toggle Option */}
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb] flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-[#4e4f50] transition-colors">
                            <Moon className={`w-4 h-4 ${isDark ? 'text-brand-500 fill-brand-500' : 'text-slate-600'}`} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-[#e4e6eb] block leading-tight">
                              Dark Mode
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-[#b0b3b8]">
                              {isDark ? 'On' : 'Off'}
                            </span>
                          </div>
                        </div>

                        {/* Facebook-style toggle pill */}
                        <div
                          className={`w-10 h-5.5 rounded-full transition-colors flex items-center p-0.5 ${
                            isDark ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <div
                            className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform ${
                              isDark ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </button>

                      <Link
                        to="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        Settings &amp; Privacy
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="p-1.5 border-t border-slate-100 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a]">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-brand-700 px-3.5 py-1.5 rounded-xl hover:bg-brand-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-brand-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-brand-700 transition-colors shadow-xs"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
