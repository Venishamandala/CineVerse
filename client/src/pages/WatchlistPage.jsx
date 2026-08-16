import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { MovieGridSkeleton } from '../components/LoadingSkeleton';
import { Bookmark, Trash2, Check, Eye, Search, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const WatchlistPage = () => {
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter states
  const [localSearch, setLocalSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unwatched, watched
  const [sortBy, setSortBy] = useState('added-desc'); // added-desc, added-asc, title-asc

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const res = await api.get('/watchlist');
      if (res.data.success) {
        setWatchlist(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load watchlist details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (movieId) => {
    try {
      const res = await api.delete(`/watchlist/${movieId}`);
      if (res.data.success) {
        setWatchlist(prev => prev.filter(w => w.movieId !== movieId));
      }
    } catch (err) {
      console.error('Failed to remove watchlist item:', err.message);
    }
  };

  const handleToggleWatched = async (movieId, currentStatus) => {
    try {
      const res = await api.patch(`/watchlist/${movieId}/watched`, {
        watched: !currentStatus
      });
      if (res.data.success) {
        setWatchlist(prev =>
          prev.map(w => (w.movieId === movieId ? { ...w, watched: res.data.data.watched } : w))
        );
      }
    } catch (err) {
      console.error('Failed to toggle watched status:', err.message);
    }
  };

  const handleRedirect = () => {
    navigate('/discover');
  };

  // Filter & Sort list
  const filteredList = watchlist
    .filter(item => {
      // Text matching
      const matchesText = item.movieTitle.toLowerCase().includes(localSearch.toLowerCase());
      // Status matching
      if (filterType === 'watched') return matchesText && item.watched;
      if (filterType === 'unwatched') return matchesText && !item.watched;
      return matchesText;
    })
    .sort((a, b) => {
      if (sortBy === 'added-desc') return new Date(b.addedAt) - new Date(a.addedAt);
      if (sortBy === 'added-asc') return new Date(a.addedAt) - new Date(b.addedAt);
      if (sortBy === 'title-asc') return a.movieTitle.localeCompare(b.movieTitle);
      return 0;
    });

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-brand" /> My Watchlist
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Keep track of movies you want to explore and organize them by status.
          </p>
        </div>

        {/* Local Search input */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search within watchlist..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full py-1.5 pl-10 pr-4 text-xs rounded-xl border dark:bg-dark-surface/80 light:bg-white dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
          />
          <Search className="absolute w-3.5 h-3.5 text-gray-400 left-3.5 top-2.5" />
        </div>
      </div>

      {/* Filter and Sort bar */}
      {watchlist.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border rounded-2xl dark:bg-dark-surface/30 light:bg-slate-100 dark:border-dark-border light:border-light-border">
          {/* Status Tabs */}
          <div className="flex space-x-1.5">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'unwatched', label: 'Unwatched' },
              { id: 'watched', label: 'Watched' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all
                  ${filterType === tab.id
                    ? 'bg-brand text-white'
                    : 'dark:text-gray-400 light:text-gray-650 hover:bg-slate-500/10'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort selection */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 rounded-lg border dark:bg-dark-surface light:bg-white dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none"
            >
              <option value="added-desc">Recently Added</option>
              <option value="added-asc">Oldest Added</option>
              <option value="title-asc">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <MovieGridSkeleton count={6} />
      ) : watchlist.length === 0 ? (
        <EmptyState
          icon="🍿"
          title="Your watchlist is waiting for its next movie"
          description="Build your lists! Saving films lets us customize your recommendations score automatically."
          ctaText="Discover Movies"
          onCtaClick={handleRedirect}
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon="🔎"
          title="No Watchlist Matches"
          description="Try adjusting your text search keywords or watched status filter tab."
          ctaText="Show All Items"
          onCtaClick={() => { setLocalSearch(''); setFilterType('all'); }}
        />
      ) : (
        /* Cards list representing watchlist items */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const posterUrl = item.posterPath
              ? `https://image.tmdb.org/t/p/w185${item.posterPath}`
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=185&auto=format&fit=crop';

            return (
              <motion.div
                key={item.movieId}
                whileHover={{ y: -3 }}
                className="flex p-3 border rounded-2xl dark:bg-dark-surface/60 light:bg-white dark:border-dark-border light:border-light-border shadow-sm group"
              >
                {/* Poster column */}
                <div className="w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-slate-900">
                  <img src={posterUrl} alt={item.movieTitle} className="object-cover w-full h-full" />
                </div>

                {/* Info and Actions column */}
                <div className="flex flex-col justify-between flex-1 ml-4 py-1">
                  <div>
                    <h3 className="font-bold text-sm dark:text-dark-text light:text-light-text line-clamp-1">
                      {item.movieTitle}
                    </h3>
                    <span className="text-[10px] text-gray-400">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Quick Controls row */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex space-x-2">
                      {/* Toggle Watched Status */}
                      <button
                        onClick={() => handleToggleWatched(item.movieId, item.watched)}
                        className={`p-1.5 rounded-lg border transition-colors
                          ${item.watched
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'dark:border-dark-border light:border-light-border text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10'
                          }
                        `}
                        title={item.watched ? 'Mark as Unwatched' : 'Mark as Watched'}
                      >
                        {item.watched ? <Check className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      {/* Remove item */}
                      <button
                        onClick={() => handleRemove(item.movieId)}
                        className="p-1.5 border dark:border-dark-border light:border-light-border text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete from Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <Link
                      to={`/movie/${item.movieId}`}
                      className="text-xs font-bold text-brand hover:underline flex items-center"
                    >
                      Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default WatchlistPage;
