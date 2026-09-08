import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Share2,
  Trash2,
  Send,
  Copy,
  Repeat,
  X,
} from 'lucide-react';
import { Post, Comment, Liker, ReactionType } from '../types';
import { commentsApi, postsApi } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  onPostShared?: (newPost: Post) => void;
}

const REACTIONS: { type: ReactionType; label: string; emoji: string; color: string }[] = [
  { type: 'LIKE', label: 'Like', emoji: '👍', color: 'text-brand-600' },
  { type: 'LOVE', label: 'Love', emoji: '❤️', color: 'text-rose-600' },
  { type: 'HAHA', label: 'Haha', emoji: '😂', color: 'text-amber-500' },
  { type: 'WOW', label: 'Wow', emoji: '😮', color: 'text-amber-500' },
  { type: 'SAD', label: 'Sad', emoji: '😢', color: 'text-amber-600' },
  { type: 'ANGRY', label: 'Angry', emoji: '😡', color: 'text-orange-600' },
];

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onPostShared }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);

  // Reactions state
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState<boolean>(post.isLikedByCurrentUser ?? false);
  const [userReaction, setUserReaction] = useState<string | undefined>(post.userReaction);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    post.reactionCounts || {}
  );
  const [likers, setLikers] = useState<Liker[]>(post.likers || []);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [showReactionDock, setShowReactionDock] = useState(false);
  const reactionTimeoutRef = useRef<any>(null);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareThought, setShareThought] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);

  const isAuthor = Boolean(user?.id && String(user.id) === String(post.authorId));

  // Reaction hover management
  const handleMouseEnterButton = () => {
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    setShowReactionDock(true);
  };

  const handleMouseLeaveButton = () => {
    reactionTimeoutRef.current = setTimeout(() => {
      setShowReactionDock(false);
    }, 350);
  };

  const handleSelectReaction = async (type: ReactionType) => {
    if (!user) {
      toast.info('Please log in to react to posts');
      return;
    }
    setShowReactionDock(false);

    const prevLiked = isLiked;
    const prevReaction = userReaction;
    const prevCount = likesCount;
    const prevCounts = { ...reactionCounts };

    // Optimistic update
    const isRemoving = isLiked && userReaction === type;
    if (isRemoving) {
      setIsLiked(false);
      setUserReaction(undefined);
      setLikesCount(Math.max(0, prevCount - 1));
      if (prevCounts[type]) prevCounts[type] = Math.max(0, prevCounts[type] - 1);
      setReactionCounts(prevCounts);
    } else {
      setIsLiked(true);
      setUserReaction(type);
      if (!prevLiked) setLikesCount(prevCount + 1);
      if (prevReaction && prevCounts[prevReaction]) {
        prevCounts[prevReaction] = Math.max(0, prevCounts[prevReaction] - 1);
      }
      prevCounts[type] = (prevCounts[type] || 0) + 1;
      setReactionCounts(prevCounts);
    }

    try {
      const res = await postsApi.toggleLike(post.id, type);
      setIsLiked(res.isLiked);
      setUserReaction(res.userReaction);
      setLikesCount(res.likesCount);
      if (res.reactionCounts) setReactionCounts(res.reactionCounts);
      if (res.likers) setLikers(res.likers);
      if (!isRemoving) {
        toast.success(`Reacted with ${REACTIONS.find((r) => r.type === type)?.emoji || '👍'}`);
      }
    } catch (err) {
      // Revert on error
      setIsLiked(prevLiked);
      setUserReaction(prevReaction);
      setLikesCount(prevCount);
      setReactionCounts(prevCounts);
      toast.error('Failed to update reaction');
    }
  };

  const handleToggleDefaultLike = () => {
    if (!user) {
      toast.info('Please log in to react to posts');
      return;
    }
    if (isLiked) {
      handleSelectReaction((userReaction as ReactionType) || 'LIKE');
    } else {
      handleSelectReaction('LIKE');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postsApi.delete(post.id);
      toast.success('Post deleted successfully');
      onPostDeleted?.(post.id);
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    if (!user) {
      toast.showErrorModal(
        'Authentication Required',
        'Please sign in to your OpenSocial account to leave comments.',
        'Sign In',
        () => navigate('/login')
      );
      return;
    }

    if (user.isDemo) {
      toast.showErrorModal(
        'Demo Account Restricted',
        'You are currently using the demo account (John Doe). Commenting, posting, and sending friend requests are restricted in demo mode. Please register or sign in with your own account!',
        'Sign In / Register',
        () => navigate('/login')
      );
      return;
    }

    setIsSubmittingComment(true);
    try {
      const newComment = await commentsApi.add(post.id, commentText.trim(), user);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      toast.success('Comment added');
    } catch (err: any) {
      toast.showErrorModal(
        'Comment Failed',
        err.response?.data?.message || 'Could not post your comment. Please try logging in with a registered account.',
        'Go to Login',
        () => navigate('/login')
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShareToFeed = async () => {
    if (!user) {
      toast.info('Please log in to share');
      return;
    }
    setIsSharing(true);
    try {
      const shared = await postsApi.share(post.id, shareThought, user, post);
      setSharesCount((prev) => prev + 1);
      setShowShareModal(false);
      setShareThought('');
      toast.success('Post shared to your feed!');
      onPostShared?.(shared);
    } catch (err) {
      toast.error('Failed to share post');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#post-${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Post link copied to clipboard!');
    setShowShareModal(false);
  };

  const activeReactionInfo = REACTIONS.find((r) => r.type === userReaction) || {
    type: 'LIKE',
    label: 'Like',
    emoji: '👍',
    color: 'text-brand-600',
  };

  // Extract unique active emojis sorted by popularity
  const topReactionTypes = Object.entries(reactionCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => REACTIONS.find((r) => r.type === type)?.emoji || '👍');

  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article
      id={`post-${post.id}`}
      className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-slate-200/80 dark:border-[#393a3b] mb-4 overflow-hidden transition-all hover:border-slate-300 dark:hover:border-[#4e4f50]"
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.authorId}`} className="relative group">
            <img
              src={
                post.authorAvatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorUsername}`
              }
              alt={post.authorName}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-[#393a3b] object-cover group-hover:opacity-90 transition-opacity"
            />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 leading-tight">
              <Link
                to={`/profile/${post.authorId}`}
                className="font-bold text-slate-900 dark:text-[#e4e6eb] hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-sm"
              >
                {post.authorName}
              </Link>
              {post.isShared && (
                <span className="text-slate-500 dark:text-[#b0b3b8] font-normal text-xs">shared a post</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#b0b3b8] mt-0.5">
              <span>@{post.authorUsername}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {isAuthor && (
          <button
            onClick={handleDelete}
            title="Delete post"
            className="text-slate-400 dark:text-[#b0b3b8] hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post Commentary / Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-slate-800 dark:text-[#e4e6eb] text-sm leading-relaxed whitespace-pre-wrap font-normal">
            {post.content}
          </p>
        </div>
      )}

      {/* Embedded Original Shared Post (Facebook Style) */}
      {post.isShared && post.sharedPost && (
        <div className="mx-4 mb-3 rounded-2xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/60 dark:bg-[#18191a]/60 overflow-hidden hover:border-slate-300 dark:hover:border-[#4e4f50] transition-colors">
          {/* Original Author Header */}
          <div className="p-3.5 flex items-center gap-2.5 border-b border-slate-100 dark:border-[#393a3b] bg-white/70 dark:bg-[#242526]/70">
            <img
              src={
                post.sharedPost.authorAvatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.sharedPost.authorUsername}`
              }
              alt={post.sharedPost.authorName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#393a3b] shrink-0"
            />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-[#e4e6eb] text-xs leading-tight truncate">
                {post.sharedPost.authorName}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-[#b0b3b8] mt-0.5 truncate">
                @{post.sharedPost.authorUsername}
              </p>
            </div>
          </div>

          {/* Original Post Text Content */}
          {post.sharedPost.content && (
            <div className="p-3.5 text-xs text-slate-800 dark:text-[#e4e6eb] leading-relaxed whitespace-pre-wrap">
              {post.sharedPost.content}
            </div>
          )}

          {/* Original Post Image Attachment */}
          {post.sharedPost.imageUrl && (
            <div className="border-t border-slate-100 dark:border-[#393a3b] bg-slate-950/5 dark:bg-black/20 flex items-center justify-center max-h-[420px] overflow-hidden">
              <img
                src={post.sharedPost.imageUrl}
                alt="Original post attachment"
                className="w-full h-auto max-h-[420px] object-cover hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                onClick={() => window.open(post.sharedPost?.imageUrl, '_blank')}
              />
            </div>
          )}
        </div>
      )}

      {/* Post Image */}
      {post.imageUrl && (
        <div className="border-t border-b border-slate-100 dark:border-[#393a3b] bg-slate-950/5 dark:bg-black/20 flex items-center justify-center max-h-[540px] overflow-hidden">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="w-full h-auto max-h-[540px] object-cover hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
            onClick={() => window.open(post.imageUrl, '_blank')}
          />
        </div>
      )}

      {/* Reactions Summary Bar */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-500 dark:text-[#b0b3b8] border-b border-slate-100 dark:border-[#393a3b]">
        {/* Reaction badges & likers */}
        <div className="flex items-center gap-1.5">
          {likesCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowLikersModal(true)}
              className="flex items-center gap-1.5 hover:underline cursor-pointer group"
            >
              <div className="flex -space-x-1 items-center">
                {topReactionTypes.length > 0 ? (
                  topReactionTypes.map((emoji, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center justify-center text-xs w-5 h-5 rounded-full bg-white dark:bg-[#3a3b3c] shadow-xs border border-slate-100 dark:border-[#393a3b]"
                    >
                      {emoji}
                    </span>
                  ))
                ) : (
                  <span className="text-xs">👍</span>
                )}
              </div>
              <span className="font-medium text-slate-600 dark:text-[#b0b3b8] group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {likesCount}
              </span>
            </button>
          ) : (
            <span className="text-slate-400 dark:text-[#b0b3b8]/70">Be the first to react</span>
          )}
        </div>

        {/* Comments & Shares Count */}
        <div className="flex items-center gap-3">
          {comments.length > 0 && (
            <button
              onClick={() => setShowCommentBox(true)}
              className="hover:underline cursor-pointer"
            >
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </button>
          )}
          {sharesCount > 0 && (
            <span>
              {sharesCount} {sharesCount === 1 ? 'share' : 'shares'}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons Bar with Floating Reaction Dock */}
      <div className="px-2 py-1 flex items-center justify-around relative">
        {/* Floating Facebook-like Reaction Bar */}
        {showReactionDock && (
          <div
            onMouseEnter={handleMouseEnterButton}
            onMouseLeave={handleMouseLeaveButton}
            className="absolute -top-12 left-4 bg-white dark:bg-[#242526] px-2 py-1.5 rounded-full shadow-2xl border border-slate-200 dark:border-[#393a3b] flex items-center gap-1.5 z-40 animate-popIn"
          >
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                type="button"
                onClick={() => handleSelectReaction(r.type)}
                className="group relative text-2xl p-1 rounded-full hover:scale-135 -translate-y-0 hover:-translate-y-1.5 transition-all duration-150 cursor-pointer"
                title={r.label}
              >
                <span>{r.emoji}</span>
                {/* Reaction label tooltip */}
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Reaction Trigger Button */}
        <div
          className="flex-1"
          onMouseEnter={handleMouseEnterButton}
          onMouseLeave={handleMouseLeaveButton}
        >
          <button
            type="button"
            onClick={handleToggleDefaultLike}
            className={`w-full py-2 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all hover:bg-slate-100 dark:hover:bg-[#3a3b3c] ${
              isLiked ? activeReactionInfo.color : 'text-slate-600 dark:text-[#b0b3b8]'
            }`}
          >
            <span className="text-base">{isLiked ? activeReactionInfo.emoji : '👍'}</span>
            <span>{isLiked ? activeReactionInfo.label : 'Like'}</span>
          </button>
        </div>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-slate-500 dark:text-[#b0b3b8]" />
          <span>Comment</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
        >
          <Share2 className="w-4 h-4 text-slate-500 dark:text-[#b0b3b8]" />
          <span>Share</span>
        </button>
      </div>

      {/* Likers / Reacted By Modal */}
      {showLikersModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowLikersModal(false)}
        >
          <div
            className="bg-white dark:bg-[#242526] rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-[#393a3b] animate-popIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#393a3b] pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#e4e6eb] flex items-center gap-1.5">
                <span>People who reacted</span>
                <span className="bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 text-xs px-2 py-0.5 rounded-full">
                  {likers.length || likesCount}
                </span>
              </h3>
              <button
                onClick={() => setShowLikersModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#e4e6eb] p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5 divide-y divide-slate-50 dark:divide-[#393a3b]/50">
              {likers.length === 0 ? (
                <div className="text-xs text-slate-400 dark:text-[#b0b3b8] text-center py-6">
                  Loading reactions...
                </div>
              ) : (
                likers.map((liker) => {
                  const emoji =
                    REACTIONS.find((r) => r.type === liker.reactionType)?.emoji || '👍';
                  return (
                    <Link
                      key={liker.id}
                      to={`/profile/${liker.id}`}
                      onClick={() => setShowLikersModal(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors pt-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            liker.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${liker.username}`
                          }
                          alt={liker.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#393a3b]"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb] truncate">
                            {liker.fullName}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-[#b0b3b8] truncate">@{liker.username}</p>
                        </div>
                      </div>
                      <span className="text-lg">{emoji}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white dark:bg-[#242526] rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-[#393a3b] animate-popIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-[#393a3b] pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#e4e6eb] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Share Post
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#e4e6eb] p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#3a3b3c]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Share Thoughts Input */}
            <div className="mb-4">
              <textarea
                value={shareThought}
                onChange={(e) => setShareThought(e.target.value)}
                placeholder="Say something about this post (optional)..."
                rows={3}
                className="w-full p-3 border border-slate-300 dark:border-[#393a3b] bg-white dark:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
              />
            </div>

            {/* Quoted Original Post Preview */}
            <div className="p-3 bg-slate-50 dark:bg-[#18191a]/60 rounded-xl border border-slate-200/80 dark:border-[#393a3b] mb-4 text-xs">
              <div className="flex items-center gap-2 mb-1.5 font-semibold text-slate-700 dark:text-[#e4e6eb]">
                <span>@{post.authorUsername}</span>
              </div>
              <p className="text-slate-600 dark:text-[#b0b3b8] line-clamp-3">{post.content}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#e4e6eb] bg-slate-100 dark:bg-[#3a3b3c] hover:bg-slate-200 dark:hover:bg-[#4e4f50] transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </button>

              <button
                type="button"
                disabled={isSharing}
                onClick={handleShareToFeed}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Repeat className="w-3.5 h-3.5" />
                {isSharing ? 'Sharing...' : 'Share to Feed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {(showCommentBox || comments.length > 0) && (
        <div className="border-t border-slate-100 dark:border-[#393a3b] p-4 bg-slate-50/40 dark:bg-[#18191a]/40">
          {/* Add Comment Input */}
          {user && (
            <form onSubmit={handleAddComment} className="flex items-center gap-2.5 mb-3">
              <img
                src={
                  user.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                }
                alt={user.fullName}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#393a3b] shrink-0 object-cover"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-slate-100 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] pl-3.5 pr-10 py-2 rounded-full text-xs border border-transparent focus:border-brand-500 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 disabled:opacity-40 p-1"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="flex flex-col gap-2.5">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2.5">
                <img
                  src={
                    comment.authorAvatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorUsername || comment.authorName}`
                  }
                  alt={comment.authorName}
                  className="w-7 h-7 rounded-full border border-slate-200 dark:border-[#393a3b] mt-1 shrink-0 object-cover"
                />
                <div className="bg-slate-100 dark:bg-[#3a3b3c] rounded-2xl px-3.5 py-2 max-w-[85%] border border-slate-200/50 dark:border-[#393a3b]">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-[#e4e6eb]">
                      {comment.authorName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-[#e4e6eb] leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
