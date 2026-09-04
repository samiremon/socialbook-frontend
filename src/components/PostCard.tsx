import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Post, Comment, Liker } from '../types';
import { commentsApi, postsApi } from '../api';
import { useAuth } from '../AuthContext';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Likes state
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || (post.likers?.length ?? 0));
  const [isLiked, setIsLiked] = useState<boolean>(post.isLikedByCurrentUser ?? false);
  const [likers, setLikers] = useState<Liker[]>(post.likers || []);
  const [showLikersModal, setShowLikersModal] = useState<boolean>(false);
  const [loadingLike, setLoadingLike] = useState<boolean>(false);

  const isAuthor = Boolean(user?.id && String(user.id) === String(post.authorId));

  const handleToggleLike = async () => {
    if (!user || loadingLike) return;
    setLoadingLike(true);
    const previousIsLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic toggle
    setIsLiked(!previousIsLiked);
    setLikesCount(previousCount + (previousIsLiked ? -1 : 1));

    try {
      const res = await postsApi.toggleLike(post.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
      if (res.likers) setLikers(res.likers);
    } catch (err) {
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousCount);
      console.error('Failed to toggle like', err);
    } finally {
      setLoadingLike(false);
    }
  };

  // Format date simply
  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await postsApi.delete(post.id);
      onPostDeleted?.(post.id);
    } catch (err) {
      alert('Failed to delete post');
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newComment = await commentsApi.add(post.id, commentText.trim(), user);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      alert('Failed to add comment');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.authorId}`}>
            <img
              src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorUsername}`}
              alt={post.authorName}
              className="w-10 h-10 rounded-full border border-slate-200 bg-blue-50"
            />
          </Link>
          <div>
            <Link
              to={`/profile/${post.authorId}`}
              className="font-bold text-slate-800 hover:text-blue-600 transition-colors block text-sm"
            >
              {post.authorName}
            </Link>
            <span className="text-xs text-slate-400">{formattedDate}</span>
          </div>
        </div>

        {isAuthor && (
          <button
            onClick={handleDelete}
            className="text-xs text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {/* Post Content */}
      <p className="text-slate-800 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Post Image (e.g. Updated Profile Picture) */}
      {post.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 flex items-center justify-center max-h-[600px]">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="w-full h-auto max-h-[600px] object-contain rounded-xl"
          />
        </div>
      )}

      {/* Like Bar & Post Stats */}
      <div className="flex items-center justify-between py-2 border-y border-slate-100 my-3 text-xs">
        {/* Like Button (Red Heart) */}
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={!user || loadingLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            isLiked
              ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 scale-105'
              : 'text-slate-600 hover:text-rose-600 hover:bg-slate-50'
          }`}
        >
          <span className="text-base leading-none transition-transform">{isLiked ? '❤️' : '🤍'}</span>
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        {/* Likers Count & View Likers Link */}
        {likesCount > 0 && (
          <button
            type="button"
            onClick={() => setShowLikersModal(true)}
            className="text-slate-500 hover:text-blue-600 hover:underline flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <span>❤️</span>
            <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
          </button>
        )}
      </div>

      {/* Likers List Modal */}
      {showLikersModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowLikersModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>❤️</span> Liked by ({likers.length || likesCount})
              </h3>
              <button
                onClick={() => setShowLikersModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
              {likers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No likers data available.</p>
              ) : (
                likers.map((liker) => (
                  <Link
                    key={liker.id}
                    to={`/profile/${liker.id}`}
                    onClick={() => setShowLikersModal(false)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <img
                      src={liker.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${liker.username}`}
                      alt={liker.fullName}
                      className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 shrink-0 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{liker.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">@{liker.username}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="border-t border-slate-100 pt-3 mt-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Comments ({comments.length})
        </h4>

        {/* Existing Comments */}
        <div className="flex flex-col gap-2 mb-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs">
              <span className="font-semibold text-slate-800 mr-2">{comment.authorName}:</span>
              <span className="text-slate-600">{comment.content}</span>
            </div>
          ))}
        </div>

        {/* Add Comment Input */}
        {user ? (
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Comment
            </button>
          </form>
        ) : (
          <p className="text-xs text-slate-400">Log in to comment.</p>
        )}
      </div>
    </article>
  );
};
