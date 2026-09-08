import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Image, Type, Clock } from 'lucide-react';
import { StoryItem } from '../types';
import { storiesApi } from '../storiesApi';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

const GRADIENT_PRESETS = [
  { name: 'Emerald Wave', class: 'from-emerald-600 via-teal-600 to-green-700' },
  { name: 'Ocean Sunset', class: 'from-blue-600 via-indigo-600 to-purple-700' },
  { name: 'Amber Sunrise', class: 'from-amber-500 via-orange-600 to-rose-600' },
  { name: 'Berry Fusion', class: 'from-rose-500 via-pink-600 to-purple-700' },
  { name: 'Midnight Glow', class: 'from-slate-900 via-emerald-950 to-slate-900' },
];

export const StoriesBar: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [stories, setStories] = useState<StoryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Add Story state
  const [storyMode, setStoryMode] = useState<'text' | 'photo'>('photo');
  const [storyText, setStoryText] = useState('');
  const [storyImageUrl, setStoryImageUrl] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].class);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Story Viewer timer state
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setStories(storiesApi.getActive());
  }, []);

  // Story Viewer auto-advance timer
  useEffect(() => {
    if (activeStoryIndex === null) {
      setProgress(0);
      return;
    }

    const currentStory = stories[activeStoryIndex];
    if (currentStory && !currentStory.isViewed) {
      storiesApi.markViewed(currentStory.id);
      setStories((prev) =>
        prev.map((s, idx) => (idx === activeStoryIndex ? { ...s, isViewed: true } : s))
      );
    }

    setProgress(0);
    const intervalTime = 60; // ms
    const totalDuration = 5000; // 5 seconds per story
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          // Go to next story or close if last
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return old + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStoryIndex, stories.length]);

  const handlePrevStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  const handleNextStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to add a story');
      return;
    }

    if (storyMode === 'photo' && !storyImageUrl.trim()) {
      toast.error('Please enter a photo URL');
      return;
    }

    if (storyMode === 'text' && !storyText.trim()) {
      toast.error('Please write some text for your story');
      return;
    }

    setIsSubmitting(true);
    try {
      const newStory = storiesApi.create(user, {
        imageUrl: storyMode === 'photo' ? storyImageUrl.trim() : undefined,
        text: storyText.trim() || undefined,
        bgGradient: storyMode === 'text' ? selectedGradient : undefined,
      });

      setStories((prev) => [newStory, ...prev]);
      setShowAddModal(false);
      setStoryText('');
      setStoryImageUrl('');
      toast.success('Story published! Active for 24 hours 🌟');
    } catch {
      toast.error('Failed to publish story');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatHoursLeft = (expiresAtStr: string) => {
    try {
      const diffMs = new Date(expiresAtStr).getTime() - Date.now();
      const hours = Math.max(1, Math.round(diffMs / 3600000));
      return `${hours}h left`;
    } catch {
      return '24h';
    }
  };

  return (
    <>
      {/* Stories Bar Container */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-3.5 mb-5 shadow-xs overflow-hidden">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {/* Card 1: Add Story (Own Profile) */}
          <div
            onClick={() => {
              if (!user) {
                toast.info('Please log in to create a story');
                return;
              }
              setShowAddModal(true);
            }}
            className="group relative w-28 h-44 sm:w-32 sm:h-48 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-[#393a3b] cursor-pointer shrink-0 bg-slate-50 dark:bg-[#3a3b3c] flex flex-col shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            {/* Top Half: User Avatar Photo */}
            <div className="h-[68%] w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              <img
                src={
                  user?.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`
                }
                alt="My Profile"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Bottom Half: Plus Icon & Label */}
            <div className="h-[32%] w-full bg-white dark:bg-[#242526] relative flex flex-col items-center justify-end pb-2">
              <div className="absolute -top-4 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-[#242526] shadow-md group-hover:bg-brand-700 transition-colors">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-[#e4e6eb] text-center px-1 leading-tight">
                Create Story
              </span>
            </div>
          </div>

          {/* Active 24-Hour Stories List */}
          {stories.map((story, index) => (
            <div
              key={story.id}
              onClick={() => setActiveStoryIndex(index)}
              className="group relative w-28 h-44 sm:w-32 sm:h-48 rounded-2xl overflow-hidden cursor-pointer shrink-0 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 border border-slate-200/60 dark:border-[#393a3b]"
            >
              {/* Background: Image or Gradient */}
              {story.imageUrl ? (
                <img
                  src={story.imageUrl}
                  alt={story.authorName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${story.bgGradient || 'from-emerald-600 to-teal-800'} p-3 flex items-center justify-center text-center`}
                >
                  <p className="text-white text-xs font-bold line-clamp-4 leading-snug drop-shadow-sm">
                    {story.text}
                  </p>
                </div>
              )}

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

              {/* Author Avatar with Glowing Ring */}
              <div className="absolute top-2.5 left-2.5">
                <div
                  className={`p-0.5 rounded-full ${
                    story.isViewed
                      ? 'ring-2 ring-white/60'
                      : 'ring-2 ring-brand-500 bg-brand-500 ring-offset-1'
                  }`}
                >
                  <img
                    src={
                      story.authorAvatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.authorUsername}`
                    }
                    alt={story.authorName}
                    className="w-8 h-8 rounded-full object-cover border border-white"
                  />
                </div>
              </div>

              {/* 24h Expiration Badge */}
              <div className="absolute top-2.5 right-2 bg-black/40 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {formatHoursLeft(story.expiresAt)}
              </div>

              {/* Author Name */}
              <div className="absolute bottom-2 left-2 right-2 text-white">
                <p className="text-xs font-bold truncate leading-tight drop-shadow-md">
                  {story.authorName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Story Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-[#242526] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[#393a3b] animate-popIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-[#393a3b] pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-[#e4e6eb]">Create 24-Hour Story</h3>
                <p className="text-xs text-slate-400 dark:text-[#b0b3b8]">Visible to all your friends for 24 hours</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#e4e6eb] p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#3a3b3c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher: Photo or Text */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#3a3b3c] rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStoryMode('photo')}
                className={`py-2 flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
                  storyMode === 'photo'
                    ? 'bg-white dark:bg-[#242526] text-brand-700 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-[#b0b3b8]'
                }`}
              >
                <Image className="w-4 h-4" />
                Photo Story
              </button>
              <button
                type="button"
                onClick={() => setStoryMode('text')}
                className={`py-2 flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
                  storyMode === 'text'
                    ? 'bg-white dark:bg-[#242526] text-brand-700 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-[#b0b3b8]'
                }`}
              >
                <Type className="w-4 h-4" />
                Text Story
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-4">
              {storyMode === 'photo' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1">Photo URL</label>
                  <input
                    type="url"
                    value={storyImageUrl}
                    onChange={(e) => setStoryImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#3a3b3c] border border-slate-200 dark:border-[#393a3b] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />

                  {/* Photo Preview */}
                  {storyImageUrl && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-[#393a3b] h-44 bg-slate-100 dark:bg-[#3a3b3c] flex items-center justify-center relative">
                      <img
                        src={storyImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => toast.error('Invalid image URL')}
                      />
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1">
                      Caption (Optional)
                    </label>
                    <input
                      type="text"
                      value={storyText}
                      onChange={(e) => setStoryText(e.target.value)}
                      placeholder="Add a comment to your story..."
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#3a3b3c] border border-slate-200 dark:border-[#393a3b] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1">Story Text</label>
                  <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Start typing your story..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#3a3b3c] border border-slate-200 dark:border-[#393a3b] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                    required
                  />

                  {/* Gradient Picker */}
                  <div className="mt-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1.5">
                      Select Background Gradient
                    </label>
                    <div className="flex items-center gap-2">
                      {GRADIENT_PRESETS.map((g) => (
                        <button
                          key={g.name}
                          type="button"
                          onClick={() => setSelectedGradient(g.class)}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.class} transition-transform ${
                            selectedGradient === g.class
                              ? 'scale-115 ring-2 ring-brand-500 ring-offset-2'
                              : 'hover:scale-105'
                          }`}
                          title={g.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Text Story Live Preview */}
                  <div
                    className={`mt-4 rounded-2xl p-6 h-40 bg-gradient-to-br ${selectedGradient} flex items-center justify-center text-center shadow-inner`}
                  >
                    <p className="text-white text-sm font-bold leading-relaxed drop-shadow-sm">
                      {storyText || 'Your story preview will look like this!'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20"
                >
                  {isSubmitting ? 'Publishing...' : 'Share to Story (24h)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Story Viewer Modal (Instagram / Facebook Style) */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveStoryIndex(null)}
        >
          {/* Main Story Container */}
          <div
            className="relative w-full max-w-sm h-[82vh] rounded-3xl overflow-hidden bg-slate-950 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar: Progress Bars */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
              {stories.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{
                      width:
                        idx < activeStoryIndex
                          ? '100%'
                          : idx === activeStoryIndex
                          ? `${progress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Author Info Bar */}
            <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    stories[activeStoryIndex].authorAvatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${stories[activeStoryIndex].authorUsername}`
                  }
                  alt={stories[activeStoryIndex].authorName}
                  className="w-9 h-9 rounded-full border-2 border-white object-cover"
                />
                <div>
                  <p className="text-white text-xs font-bold leading-tight drop-shadow-md">
                    {stories[activeStoryIndex].authorName}
                  </p>
                  <p className="text-white/80 text-[10px] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatHoursLeft(stories[activeStoryIndex].expiresAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveStoryIndex(null)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Story Content: Image or Gradient */}
            <div className="w-full h-full flex items-center justify-center relative">
              {stories[activeStoryIndex].imageUrl ? (
                <>
                  <img
                    src={stories[activeStoryIndex].imageUrl}
                    alt="Story Content"
                    className="w-full h-full object-cover"
                  />
                  {stories[activeStoryIndex].text && (
                    <div className="absolute bottom-10 left-4 right-4 bg-black/60 backdrop-blur-xs text-white p-3.5 rounded-2xl text-xs text-center font-medium leading-relaxed">
                      {stories[activeStoryIndex].text}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${
                    stories[activeStoryIndex].bgGradient || 'from-emerald-600 to-teal-800'
                  } p-8 flex items-center justify-center text-center`}
                >
                  <p className="text-white text-lg sm:text-xl font-bold leading-relaxed drop-shadow-md">
                    {stories[activeStoryIndex].text}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Left / Right Click Areas */}
            <button
              onClick={handlePrevStory}
              disabled={activeStoryIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white disabled:opacity-0 p-2 rounded-full hover:bg-black/30 transition-colors z-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNextStory}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-black/30 transition-colors z-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
