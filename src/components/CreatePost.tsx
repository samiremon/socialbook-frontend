import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Smile, Send, X } from 'lucide-react';
import { postsApi } from '../api';
import { useAuth } from '../AuthContext';
import { Post } from '../types';
import { useToast } from '../ToastContext';

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        toast.success('Image selected!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !imageUrl.trim()) || loading) return;

    if (user.isDemo) {
      toast.showErrorModal(
        'Demo Account Restricted',
        'You are currently using the demo account (John Doe). Publishing posts is disabled in demo mode. Please register or sign in with your own account!',
        'Sign In / Register',
        () => navigate('/login')
      );
      return;
    }

    setLoading(true);
    try {
      const newPost = await postsApi.create(content.trim(), user, imageUrl.trim() || undefined);
      setContent('');
      setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Post published to OpenSocial!');
      onPostCreated(newPost);
    } catch (err: any) {
      toast.showErrorModal(
        'Failed to Publish Post',
        err.response?.data?.message || 'Could not create post. Please check your connection and try again.'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-slate-200/80 dark:border-[#393a3b] p-4 mb-5 transition-colors duration-150">
      <form onSubmit={handleSubmit}>
        {/* Top row: Avatar + Textarea */}
        <div className="flex items-start gap-3 mb-3">
          <img
            src={
              user.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
            }
            alt={user.fullName}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-[#393a3b] object-cover mt-0.5 shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${user.fullName.split(' ')[0]}?`}
              rows={2}
              className="w-full bg-slate-50 dark:bg-[#3a3b3c] hover:bg-slate-100/70 dark:hover:bg-[#4e4f50] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb] p-3 rounded-xl text-sm border border-transparent focus:border-brand-500 focus:outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder-[#b0b3b8]"
            />
          </div>
        </div>

        {/* Image Attachment Preview */}
        {imageUrl && (
          <div className="mb-3 relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#393a3b] max-h-64 bg-slate-100 dark:bg-[#18191a] flex items-center justify-center">
            <img src={imageUrl} alt="Upload preview" className="max-h-64 w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setImageUrl('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 rounded-full backdrop-blur-xs transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Bottom action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#393a3b]">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                imageUrl
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold'
                  : 'text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c]'
              }`}
            >
              <Image className="w-4 h-4 text-emerald-500" />
              <span>{imageUrl ? 'Photo Attached' : 'Upload Photo'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setContent((prev) => prev + ' 😊');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors cursor-pointer"
            >
              <Smile className="w-4 h-4 text-amber-500" />
              <span>Feeling</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={(!content.trim() && !imageUrl.trim()) || loading}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-sm shadow-brand-600/20 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Posting...' : 'Post'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
