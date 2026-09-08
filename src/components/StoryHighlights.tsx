import React, { useState, useEffect } from 'react';
import { Plus, X, Sparkles, Trash2 } from 'lucide-react';
import { HighlightItem } from '../types';
import { highlightsApi } from '../storiesApi';
import { useToast } from '../ToastContext';

interface StoryHighlightsProps {
  userId: string | number;
  isOwnProfile: boolean;
}

export const StoryHighlights: React.FC<StoryHighlightsProps> = ({ userId, isOwnProfile }) => {
  const toast = useToast();

  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightItem | null>(null);

  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setHighlights(highlightsApi.getUserHighlights(userId));
  }, [userId]);

  const handleCreateHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !coverUrl.trim()) {
      toast.error('Please provide both a title and a cover image URL');
      return;
    }

    setIsSubmitting(true);
    try {
      const newHl = highlightsApi.create(userId, title, coverUrl);
      setHighlights((prev) => [...prev, newHl]);
      setShowAddModal(false);
      setTitle('');
      setCoverUrl('');
      toast.success('Story Highlight added to your profile! 🌟');
    } catch {
      toast.error('Failed to create highlight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHighlight = (e: React.MouseEvent, hlId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this highlight?')) return;
    highlightsApi.delete(hlId);
    setHighlights((prev) => prev.filter((h) => h.id !== hlId));
    toast.info('Highlight removed');
    if (selectedHighlight?.id === hlId) setSelectedHighlight(null);
  };

  if (highlights.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div className="mt-5 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          Story Highlights
        </h3>
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors"
          >
            + Add New
          </button>
        )}
      </div>

      {/* Highlights Circular Bubbles Row */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
        {/* "+ New" Bubble for own profile */}
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 group-hover:border-brand-500 bg-slate-50 flex items-center justify-center transition-colors shadow-xs">
              <Plus className="w-6 h-6 text-slate-400 group-hover:text-brand-600 transition-colors" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 group-hover:text-brand-700">
              New
            </span>
          </button>
        )}

        {/* Existing Highlights */}
        {highlights.map((hl) => (
          <div
            key={hl.id}
            onClick={() => setSelectedHighlight(hl)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full p-0.5 ring-2 ring-brand-500 ring-offset-2 overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-200">
              <img
                src={hl.coverUrl}
                alt={hl.title}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="text-[11px] font-bold text-slate-800 text-center max-w-[72px] truncate group-hover:text-brand-600">
              {hl.title}
            </span>
          </div>
        ))}
      </div>

      {/* Add Highlight Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-popIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" />
                New Story Highlight
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHighlight} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Highlight Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Travel ✈️, Memories 🌟"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cover Photo URL
                </label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              {coverUrl && (
                <div className="flex items-center justify-center p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-500 shadow-sm">
                    <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Highlight Modal */}
      {selectedHighlight && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedHighlight(null)}
        >
          <div
            className="relative max-w-sm w-full rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-white/20 p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between mb-3 text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <span>🌟</span>
                <span>{selectedHighlight.title}</span>
              </h4>
              <div className="flex items-center gap-1">
                {isOwnProfile && (
                  <button
                    onClick={(e) => handleDeleteHighlight(e, selectedHighlight.id)}
                    className="text-rose-400 hover:text-rose-300 p-1 rounded-full hover:bg-white/10"
                    title="Delete Highlight"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedHighlight(null)}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="w-full h-80 rounded-2xl overflow-hidden border border-white/10 relative">
              <img
                src={selectedHighlight.coverUrl}
                alt={selectedHighlight.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
