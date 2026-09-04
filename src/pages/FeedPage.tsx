import React, { useEffect, useState } from 'react';
import { Post } from '../types';
import { postsApi } from '../api';
import { CreatePost } from '../components/CreatePost';
import { PostCard } from '../components/PostCard';

export const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      const data = await postsApi.getAll();
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-xl font-bold text-slate-800 mb-4">News Feed</h1>

      {/* Create Post Section */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 text-sm">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No posts in the feed yet. Write the first post above!
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
        ))
      )}
    </div>
  );
};
