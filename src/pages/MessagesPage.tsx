import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Send,
  Search,
  Check,
  CheckCheck,
  Smile,
  Users,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { Message, Conversation, FriendUser } from '../types';
import { usersApi, messagesApi, friendshipsApi } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

interface ChatPartner {
  id: string | number;
  fullName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserParam = searchParams.get('user');

  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load friends and existing conversations (Users see friends messages, not all random users)
  const loadConversations = async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch confirmed friends
      const friendsList: FriendUser[] = await friendshipsApi.getFriends();

      // 2. Fetch active conversations from backend
      const convos: Conversation[] = await messagesApi.getConversations();

      // Combine friends and conversations into unique partners list
      const partnerMap = new Map<string, ChatPartner>();

      // First add friends
      friendsList.forEach((f) => {
        const idStr = String(f.id);
        partnerMap.set(idStr, {
          id: f.id,
          fullName: f.fullName,
          username: f.username,
          avatarUrl: f.avatarUrl,
          bio: f.bio,
          lastMessage: '',
          lastMessageTime: '',
          unreadCount: 0,
        });
      });

      // Overlay conversation details
      convos.forEach((c) => {
        const idStr = String(c.partnerId);
        const existing = partnerMap.get(idStr);
        if (existing) {
          existing.lastMessage = c.lastMessage;
          existing.lastMessageTime = c.lastMessageTime;
          existing.unreadCount = c.unreadCount;
        } else {
          // If conversation exists with non-friend, include them in messages list
          partnerMap.set(idStr, {
            id: c.partnerId,
            fullName: c.partnerName,
            username: c.partnerUsername,
            avatarUrl: c.partnerAvatar,
            lastMessage: c.lastMessage,
            lastMessageTime: c.lastMessageTime,
            unreadCount: c.unreadCount,
          });
        }
      });

      // If a specific targetUserParam is passed in URL (e.g. clicked "Message" from profile)
      if (targetUserParam && !partnerMap.has(String(targetUserParam))) {
        try {
          const targetUser = await usersApi.getById(targetUserParam);
          if (targetUser) {
            partnerMap.set(String(targetUser.id), {
              id: targetUser.id,
              fullName: targetUser.fullName,
              username: targetUser.username,
              avatarUrl: targetUser.avatarUrl,
              bio: targetUser.bio,
              lastMessage: '',
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
            });
          }
        } catch {}
      }

      // Sort partners: MOST RECENT MESSAGES AT THE TOP!
      const sortedPartners = Array.from(partnerMap.values()).sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setPartners(sortedPartners);

      // Select partner
      if (targetUserParam) {
        const found = sortedPartners.find((p) => String(p.id) === String(targetUserParam));
        if (found) setSelectedPartner(found);
        else if (sortedPartners.length > 0 && !selectedPartner) setSelectedPartner(sortedPartners[0]);
      } else if (sortedPartners.length > 0 && !selectedPartner) {
        setSelectedPartner(sortedPartners[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser, targetUserParam]);

  // Fetch messages between currentUser and selectedPartner + real-time polling every 4s
  const fetchActiveMessages = async () => {
    if (!selectedPartner || !currentUser) return;
    try {
      const list = await messagesApi.getBetween(selectedPartner.id, currentUser.id);
      setMessages(list);

      // Clear unread count for this partner locally
      setPartners((prev) =>
        prev.map((p) =>
          String(p.id) === String(selectedPartner.id) ? { ...p, unreadCount: 0 } : p
        )
      );
    } catch (err) {
      console.warn('Failed to load messages', err);
    }
  };

  useEffect(() => {
    fetchActiveMessages();
    const interval = setInterval(fetchActiveMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedPartner, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartner || !currentUser) return;

    if (currentUser.isDemo) {
      toast.showErrorModal(
        'Demo Account Restricted',
        'You are currently using the demo account (John Doe). Sending messages is disabled for demo visitors. Please register or sign in with your own account!',
        'Sign In / Register',
        () => navigate('/login')
      );
      return;
    }

    const text = inputText.trim();
    setInputText('');

    try {
      const newMsg = await messagesApi.send(selectedPartner.id, text, currentUser);
      setMessages((prev) => [...prev, newMsg]);

      // Move selectedPartner to the VERY TOP of the list (Recent msg in the top)
      setPartners((prev) => {
        const updatedPartner: ChatPartner = {
          ...selectedPartner,
          lastMessage: text,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        };
        const rest = prev.filter((p) => String(p.id) !== String(selectedPartner.id));
        return [updatedPartner, ...rest];
      });
    } catch (err: any) {
      toast.showErrorModal(
        'Message Failed',
        err.response?.data?.message || 'Failed to send message. If you are using the demo account, please log in with your own account.'
      );
      setInputText(text);
    }
  };

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-slate-600">
        Please log in to access your direct messages.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-slate-200/80 dark:border-[#393a3b] grid grid-cols-1 md:grid-cols-12 min-h-[640px] overflow-hidden">
        {/* LEFT COLUMN: Friends & Conversations Sidebar (4 cols) */}
        <div
          className={`md:col-span-4 border-r border-slate-200 dark:border-[#393a3b] flex flex-col bg-slate-50/50 dark:bg-[#18191a]/40 ${
            selectedPartner ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-200/80 dark:border-[#393a3b] bg-white dark:bg-[#242526]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-slate-900 dark:text-[#e4e6eb] flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Chats
              </h2>
              <Link
                to="/friends"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                + Find Friends
              </Link>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-[#b0b3b8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full bg-slate-100 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] pl-9 pr-4 py-1.5 rounded-full text-xs border border-transparent focus:border-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Conversations List (Recent on top) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#393a3b]/60 p-2 space-y-1">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-[#b0b3b8]">Loading friends...</div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-[#b0b3b8] text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-[#e4e6eb] mb-1">No friends to chat with yet</p>
                <p className="text-[11px] text-slate-400 dark:text-[#b0b3b8] mb-3">
                  Connect with people in "People You May Know" to start messaging!
                </p>
                <Link
                  to="/friends"
                  className="inline-block bg-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-brand-700 transition-colors"
                >
                  View Friends Hub
                </Link>
              </div>
            ) : (
              filteredPartners.map((partner) => {
                const isSelected = selectedPartner?.id === partner.id;
                const hasUnread = (partner.unreadCount || 0) > 0;

                return (
                  <button
                    key={partner.id}
                    onClick={() => {
                      setSelectedPartner(partner);
                      setSearchParams({ user: String(partner.id) });
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'bg-brand-50/80 dark:bg-brand-900/30 border border-brand-200/60 dark:border-brand-700/50 shadow-xs'
                        : 'hover:bg-slate-100/70 dark:hover:bg-[#3a3b3c]'
                    }`}
                  >
                    {/* Avatar with Online Dot */}
                    <div className="relative shrink-0">
                      <img
                        src={
                          partner.avatarUrl ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.username}`
                        }
                        alt={partner.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-[#393a3b]"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#242526]" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={`text-xs truncate ${
                            hasUnread ? 'font-extrabold text-slate-900 dark:text-[#e4e6eb]' : 'font-bold text-slate-800 dark:text-[#e4e6eb]'
                          }`}
                        >
                          {partner.fullName}
                        </p>
                        {partner.lastMessageTime && (
                          <span className="text-[10px] text-slate-400 dark:text-[#b0b3b8] shrink-0">
                            {formatMessageTime(partner.lastMessageTime)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            hasUnread ? 'font-bold text-brand-700 dark:text-brand-400' : 'text-slate-500 dark:text-[#b0b3b8]'
                          }`}
                        >
                          {partner.lastMessage || 'Say hello to start chatting 👋'}
                        </p>
                        {hasUnread && (
                          <span className="bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                            {partner.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Panel (8 cols) */}
        <div
          className={`md:col-span-8 flex flex-col justify-between bg-white dark:bg-[#242526] ${
            !selectedPartner ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedPartner ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 px-5 border-b border-slate-200/80 dark:border-[#393a3b] flex items-center justify-between bg-slate-50/50 dark:bg-[#18191a]/40">
                <div className="flex items-center gap-3">
                  {/* Mobile Back button */}
                  <button
                    onClick={() => setSelectedPartner(null)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-[#e4e6eb] hover:bg-slate-200 dark:hover:bg-[#3a3b3c] rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <Link to={`/profile/${selectedPartner.id}`} className="relative group">
                    <img
                      src={
                        selectedPartner.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPartner.username}`
                      }
                      alt={selectedPartner.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-[#393a3b]"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#242526]" />
                  </Link>

                  <div>
                    <Link
                      to={`/profile/${selectedPartner.id}`}
                      className="font-bold text-sm text-slate-900 dark:text-[#e4e6eb] hover:text-brand-600 dark:hover:text-brand-400 transition-colors block leading-tight"
                    >
                      {selectedPartner.fullName}
                    </Link>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Active now</span>
                  </div>
                </div>

                <Link
                  to={`/profile/${selectedPartner.id}`}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  View Profile
                </Link>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 p-5 overflow-y-auto max-h-[500px] flex flex-col gap-3 bg-[#fdfdfd] dark:bg-[#18191a]">
                {messages.length === 0 ? (
                  <div className="m-auto text-center py-12">
                    <img
                      src={
                        selectedPartner.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPartner.username}`
                      }
                      alt={selectedPartner.fullName}
                      className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-brand-500"
                    />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-[#e4e6eb]">
                      {selectedPartner.fullName}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-[#b0b3b8] mb-2">@{selectedPartner.username}</p>
                    <p className="text-xs text-slate-500 dark:text-[#b0b3b8]">
                      You are connected on OpenSocial. Wave or say hi to start chatting!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isSelf = String(msg.senderId) === String(currentUser.id);

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            isSelf
                              ? 'bg-brand-600 text-white rounded-br-xs shadow-xs'
                              : 'bg-slate-100 dark:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb] rounded-bl-xs border border-slate-200/60 dark:border-[#393a3b]'
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Timestamp & Facebook-style Seen Status */}
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <span className="text-[10px] text-slate-400 dark:text-[#b0b3b8]">
                            {formatMessageTime(msg.createdAt)}
                          </span>

                          {/* Outgoing Seen Checkmarks */}
                          {isSelf && (
                            <span className="flex items-center text-[10px] text-slate-400 dark:text-[#b0b3b8]">
                              {msg.isRead ? (
                                <span className="flex items-center gap-0.5 text-brand-600 dark:text-brand-400 font-bold">
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Seen</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-slate-400 dark:text-[#b0b3b8]">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Sent</span>
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 px-5 border-t border-slate-200/80 dark:border-[#393a3b] bg-white dark:bg-[#242526] flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + ' 😊')}
                  className="text-slate-400 dark:text-[#b0b3b8] hover:text-amber-500 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${selectedPartner.fullName}...`}
                  className="flex-1 bg-slate-100 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] px-4 py-2.5 rounded-full text-xs border border-transparent focus:border-brand-500 focus:outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white p-2.5 rounded-full transition-colors shadow-sm shadow-brand-600/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center p-8 text-slate-400 dark:text-[#b0b3b8] text-xs">
              <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              Select a friend to open conversation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
