import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Message } from '../types';
import { usersApi, messagesApi } from '../api';
import { useAuth } from '../AuthContext';

export const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetUserParam = searchParams.get('user');

  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load users sorted by newest activity first
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const allUsers = await usersApi.getAll();
        const otherUsers = allUsers.filter((u) => String(u.id) !== String(currentUser?.id));

        // Fetch recent conversation order from backend
        const recentUserIds = await messagesApi.getRecent();

        // Sort users: newest active chats at top, followed by other registered users
        const sortedUsers = [...otherUsers].sort((a, b) => {
          const indexA = recentUserIds.indexOf(Number(a.id));
          const indexB = recentUserIds.indexOf(Number(b.id));
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });

        setUsers(sortedUsers);

        if (targetUserParam) {
          const found = sortedUsers.find((u) => String(u.id) === String(targetUserParam));
          if (found) setSelectedUser(found);
          else if (sortedUsers.length > 0) setSelectedUser(sortedUsers[0]);
        } else if (sortedUsers.length > 0) {
          setSelectedUser(sortedUsers[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadConversations();
    }
  }, [currentUser, targetUserParam]);

  // Load messages whenever selectedUser changes
  useEffect(() => {
    if (selectedUser && currentUser) {
      messagesApi.getBetween(selectedUser.id, currentUser.id).then((list) => {
        setMessages(list);
      });
    }
  }, [selectedUser, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser || !currentUser) return;

    const text = inputText.trim();
    setInputText('');
    try {
      const newMsg = await messagesApi.send(selectedUser.id, text, currentUser);
      setMessages((prev) => [...prev, newMsg]);

      // Move the active user to top of the sidebar (newest activity first!)
      setUsers((prev) => {
        const remaining = prev.filter((u) => String(u.id) !== String(selectedUser.id));
        return [selectedUser, ...remaining];
      });
    } catch (err) {
      alert('Failed to send message');
      console.error(err);
      setInputText(text);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-slate-600">
        Please log in to access direct messages.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Direct Messages</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 min-h-[480px] overflow-hidden">
        {/* Left Side: Users List */}
        <div className="border-r border-slate-200 bg-slate-50 p-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
            Select User
          </h2>
          {loading ? (
            <div className="text-xs text-slate-400 p-2">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-xs text-slate-400 p-2">No other registered users.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {users.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <img
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                      alt={u.fullName}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate font-medium">{u.fullName}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        @{u.username}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Chat Window */}
        <div className="md:col-span-2 flex flex-col justify-between bg-white">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="p-3 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
                <img
                  src={selectedUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                  alt={selectedUser.fullName}
                  className="w-8 h-8 rounded-full border border-slate-200"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{selectedUser.fullName}</h3>
                  <p className="text-xs text-slate-400">@{selectedUser.username}</p>
                </div>
              </div>

              {/* Messages History */}
              <div className="flex-1 p-4 overflow-y-auto max-h-96 flex flex-col gap-2.5">
                {messages.length === 0 ? (
                  <div className="m-auto text-center text-xs text-slate-400">
                    No messages yet with {selectedUser.fullName}. Say hi! 👋
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = String(msg.senderId) === String(currentUser.id);
                    const timeString = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-3.5 py-2 rounded-xl text-xs leading-relaxed ${
                            isSelf
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {timeString && (
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {timeString}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${selectedUser.fullName}...`}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center text-xs text-slate-400 p-6">
              Select a user to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
