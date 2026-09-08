import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  UserPlus,
  UserCheck,
  Camera,
  Check,
  X,
  Upload,
} from 'lucide-react';
import { User, Post } from '../types';
import { usersApi, postsApi, friendshipsApi } from '../api';
import { useAuth } from '../AuthContext';
import { PostCard } from '../components/PostCard';
import { StoryHighlights } from '../components/StoryHighlights';
import { useToast } from '../ToastContext';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Friendship status for other user profiles
  const [friendshipStatus, setFriendshipStatus] = useState<
    'NONE' | 'FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'SELF'
  >('NONE');
  const [friendshipId, setFriendshipId] = useState<number | undefined>(undefined);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  // Profile picture upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [showPhotoUrlModal, setShowPhotoUrlModal] = useState(false);
  const [showFullPhotoModal, setShowFullPhotoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const targetId = id || (currentUser?.id ? String(currentUser.id) : '1');
  const isOwnProfile = Boolean(currentUser?.id && String(currentUser.id) === String(targetId));

  // Cover photo state
  const [coverUrl, setCoverUrl] = useState<string>(() => {
    return localStorage.getItem(`cover_${targetId}`) || '';
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const u = await usersApi.getById(targetId);
        if (u) {
          setProfile(u);
          setEditName(u.fullName);
          setEditBio(u.bio || '');
        }

        const allPosts = await postsApi.getAll();
        setUserPosts(allPosts.filter((p) => String(p.authorId) === String(targetId)));

        // Check friendship status if viewing another user
        if (!isOwnProfile && currentUser) {
          const statusRes = await friendshipsApi.getStatus(targetId);
          setFriendshipStatus(statusRes.status as any);
          setFriendshipId(statusRes.friendshipId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetId, isOwnProfile, currentUser]);

  const handleApplyNewAvatar = async (newAvatarUrl: string) => {
    if (!currentUser || isUploadingPhoto) return;

    setIsUploadingPhoto(true);
    try {
      const { updatedUser, newPost } = await usersApi.changeProfilePicture(
        currentUser,
        newAvatarUrl
      );

      setProfile(updatedUser);
      updateUser(updatedUser);
      setUserPosts((prev) => [newPost, ...prev]);

      setShowPhotoUrlModal(false);
      setPhotoUrlInput('');
      toast.success('Profile picture updated & shared to your feed!');
    } catch (err) {
      toast.error('Failed to update profile picture.');
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        handleApplyNewAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setCoverUrl(reader.result);
        localStorage.setItem(`cover_${targetId}`, reader.result);
        toast.success('Cover photo updated!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (currentUser?.isDemo) {
      toast.showErrorModal(
        'Demo Account Restricted',
        'Profile editing is disabled in demo mode. Please register or sign in with your own account!',
        'Sign In / Register',
        () => navigate('/login')
      );
      return;
    }

    try {
      const updated = await usersApi.updateProfile(profile.id, editName, editBio);
      setProfile(updated);
      if (isOwnProfile) {
        updateUser(updated);
      }
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;

    if (currentUser?.isDemo) {
      toast.showErrorModal(
        'Demo Account Restricted',
        'You are currently using the demo account (John Doe). Sending friend requests is disabled for demo visitors. Please register or sign in with your own account to connect with people!',
        'Sign In / Register',
        () => navigate('/login')
      );
      return;
    }

    try {
      await friendshipsApi.sendRequest(profile.id);
      setFriendshipStatus('PENDING_SENT');
      toast.success('Friend request sent!');
    } catch {
      toast.showErrorModal(
        'Friend Request Failed',
        'Unable to send friend request. If you are using the demo account, please log in with a registered account.'
      );
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendshipId) return;

    if (currentUser?.isDemo) {
      toast.showErrorModal(
        'Demo Account Restricted',
        'Accepting friend requests is disabled in demo mode. Please register or sign in with your own account!',
        'Sign In / Register',
        () => navigate('/login')
      );
      return;
    }

    try {
      await friendshipsApi.acceptRequest(friendshipId);
      setFriendshipStatus('FRIENDS');
      toast.success(`You are now friends with ${profile?.fullName}!`);
    } catch {
      toast.error('Failed to accept request');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-400 text-xs">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500 text-xs">
        User not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 mb-6">
        {/* Cover Banner with Upload Support */}
        <div
          className="h-36 -mt-6 -mx-6 rounded-t-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-blue-500 relative mb-12 shadow-inner overflow-hidden bg-cover bg-center"
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        >
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-4 bg-slate-900/70 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Change Cover Photo"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Cover</span>
            </button>
          )}
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-24 px-2">
          {/* Avatar with Camera Icon */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-2xl border-4 border-white bg-slate-100 overflow-hidden shadow-md flex items-center justify-center relative">
              <img
                src={
                  profile.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`
                }
                alt={profile.fullName}
                className="w-full h-full object-cover object-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => profile.avatarUrl && setShowFullPhotoModal(true)}
              />
            </div>

            {isOwnProfile && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-xl shadow-md transition-colors cursor-pointer"
                title="Upload new profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-end">
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-brand-600" />
                  <span>Upload Picture</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs cursor-pointer"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {friendshipStatus === 'NONE' && (
                  <button
                    type="button"
                    onClick={handleSendFriendRequest}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                  </button>
                )}

                {friendshipStatus === 'PENDING_SENT' && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 text-slate-600">
                    <Check className="w-4 h-4 text-brand-600" />
                    Request Sent
                  </span>
                )}

                {friendshipStatus === 'PENDING_RECEIVED' && (
                  <button
                    type="button"
                    onClick={handleAcceptFriendRequest}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    Accept Request
                  </button>
                )}

                {friendshipStatus === 'FRIENDS' && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-brand-50 text-brand-700">
                    <UserCheck className="w-4 h-4 text-brand-600" />
                    Friends
                  </span>
                )}

                <Link
                  to={`/messages?user=${profile.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-brand-600" />
                  Message
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="mt-4">
          <h1 className="text-xl font-black text-slate-900 leading-tight">{profile.fullName}</h1>
          <p className="text-xs text-slate-400 mt-0.5">@{profile.username}</p>
        </div>

        {/* Modal for Pasting Photo URL */}
        {showPhotoUrlModal && (
          <div className="mt-4 p-4 bg-brand-50/60 border border-brand-200 rounded-xl animate-fadeIn">
            <h4 className="text-xs font-bold text-brand-900 mb-2">Change Profile Picture via URL</h4>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 bg-white border border-brand-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="button"
                disabled={!photoUrlInput.trim() || isUploadingPhoto}
                onClick={() => handleApplyNewAvatar(photoUrlInput.trim())}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowPhotoUrlModal(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bio or Edit Form */}
        {!isEditing ? (
          <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
            {profile.bio || 'No bio provided yet.'}
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                placeholder="Write a brief bio about yourself..."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Story Highlights Section (Like Facebook) */}
        <StoryHighlights userId={targetId} isOwnProfile={isOwnProfile} />
      </div>

      {/* User Posts Timeline */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>Posts by {profile.fullName.split(' ')[0]}</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
            {userPosts.length}
          </span>
        </h2>

        {userPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
            No posts published yet.
          </div>
        ) : (
          userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={(postId) =>
                setUserPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)))
              }
            />
          ))
        )}
      </div>

      {/* Full Photo Modal */}
      {showFullPhotoModal && profile.avatarUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowFullPhotoModal(false)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowFullPhotoModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-full h-auto max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

