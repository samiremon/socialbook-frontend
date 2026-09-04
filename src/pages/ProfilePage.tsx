import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Post } from '../types';
import { usersApi, postsApi } from '../api';
import { useAuth } from '../AuthContext';
import { PostCard } from '../components/PostCard';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, updateUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  const targetId = id || (currentUser?.id ? String(currentUser.id) : '1');
  const isOwnProfile = Boolean(currentUser?.id && String(currentUser.id) === String(targetId));

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetId]);

  // Handle uploading/changing profile picture
  const handleApplyNewAvatar = async (newAvatarUrl: string) => {
    if (!currentUser || isUploadingPhoto) return;

    setIsUploadingPhoto(true);
    try {
      // 1. Update profile avatar AND automatically generate a feed post
      const { updatedUser, newPost } = await usersApi.changeProfilePicture(
        currentUser,
        newAvatarUrl
      );

      // 2. Update local profile and AuthContext
      setProfile(updatedUser);
      updateUser(updatedUser);

      // 3. Add the newly created post directly into the user's posts list
      setUserPosts((prev) => [newPost, ...prev]);

      setShowPhotoUrlModal(false);
      setPhotoUrlInput('');
      alert('Profile picture updated! A post has been created in the feed.');
    } catch (err) {
      alert('Failed to update profile picture.');
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle local file selection from computer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to Base64 Data URL for instant display and posting
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        handleApplyNewAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const updated = await usersApi.updateProfile(profile.id, editName, editBio);
      setProfile(updated);
      if (isOwnProfile) {
        updateUser(updated);
      }
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-sm">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center py-12 text-slate-500 text-sm">User not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar with Change Photo overlay for own profile */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-blue-500 bg-slate-100 overflow-hidden flex items-center justify-center shadow-sm relative">
                <img
                  src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                  alt={profile.fullName}
                  className="w-full h-full object-cover object-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => profile.avatarUrl && setShowFullPhotoModal(true)}
                  title={profile.avatarUrl ? "Click to view full photo" : ""}
                />
              </div>

              {isOwnProfile && (
                <div className="mt-2 flex flex-col gap-1 w-24 sm:w-28">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors text-center"
                  >
                    {isUploadingPhoto ? 'Uploading...' : '📁 Upload Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPhotoUrlModal(true)}
                    className="text-[10px] text-slate-500 hover:text-slate-700 underline text-center"
                  >
                    or paste URL
                  </button>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800">{profile.fullName}</h1>
              <p className="text-xs text-slate-500">@{profile.username}</p>
              <p className="text-xs text-slate-400 mt-0.5">{profile.email}</p>
            </div>
          </div>

          <div className="flex gap-2 self-start">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            ) : (
              <Link
                to={`/messages?user=${profile.id}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Send Message
              </Link>
            )}
          </div>
        </div>

        {/* Modal for Pasting Photo URL */}
        {showPhotoUrlModal && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-bold text-blue-800 mb-1">Enter Image URL</h4>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 px-3 py-1.5 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                disabled={!photoUrlInput.trim() || isUploadingPhoto}
                onClick={() => handleApplyNewAvatar(photoUrlInput.trim())}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded"
              >
                Apply
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

        {/* Bio */}
        {!isEditing ? (
          <p className="text-sm text-slate-700 mt-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            {profile.bio || 'No bio provided yet.'}
          </p>
        ) : (
          <form onSubmit={handleSaveProfile} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg self-end transition-colors"
            >
              Save Profile
            </button>
          </form>
        )}
      </div>

      {/* User's Posts */}
      <h2 className="text-base font-bold text-slate-800 mb-3">Posts by {profile.fullName} ({userPosts.length})</h2>
      {userPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-sm">
          This user has not posted anything yet.
        </div>
      ) : (
        userPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPostDeleted={(id) => setUserPosts((prev) => prev.filter((p) => p.id !== id))}
          />
        ))
      )}

      {/* Full Photo Modal */}
      {showFullPhotoModal && profile.avatarUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowFullPhotoModal(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
            <p className="text-white/80 text-xs mt-3 bg-white/10 px-3 py-1 rounded-full">
              Click anywhere to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
