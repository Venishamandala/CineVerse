import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { MovieGridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { Filter, SlidersHorizontal, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mobile Filter Drawer Toggle
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Trailer Modal
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerTitle, setTrailerTitle] = useState('');

  // Languages list supported
  const languagesList = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' },
    { code: 'ta', name: 'Tamil' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ko', name: 'Korean' },
    { code: 'ja', name: 'Japanese' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' }
  ];

  // Years array (last 30 years + Classic)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

  // Load genres and watchlist on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [genreRes, watchlistRes] = await Promise.all([
          api.get('/movies/genres'),
          api.get('/watchlist')
        ]);
        if (genreRes.data.success) {
          setGenres(genreRes.data.data.genres);
        }
        if (watchlistRes.data.success) {
          setWatchlistIds(watchlistRes.data.data.map(w => w.movieId));
        }
      } catch (err) {
        console.error('Failed to load discover page metadata:', err.message);
      }
    };
    fetchMetadata();
  }, []);

  // Listen to URL search changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchQuery(q);
    setPage(1); // Reset page on query shift
  }, [searchParams]);

  // Main movie fetch action
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let res;
        // If there's an active text query, we trigger text search
        if (searchQuery.trim()) {
          res = await api.get('/movies/search', {
            params: { q: searchQuery, page }
          });
        } else {
          // Otherwise trigger discover with criteria filters
          res = await api.get('/movies/discover', {
            params: {
              genre: selectedGenre,
              language: selectedLanguage,
              year: selectedYear,
              sortBy,
              page
            }
          });
        }

        if (res.data.success) {
          setMovies(res.data.data.results || []);
          setTotalPages(res.data.data.total_pages || 1);
        }
      } catch (err) {
        console.error('Discover movie fetch failure:', err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce text search or trigger instant filter changes
    const delayDebounceFn = setTimeout(() => {
      fetchMovies();
    }, searchQuery.trim() ? 500 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedGenre, selectedLanguage, selectedYear, sortBy, page]);

  const handleWatchlistToggle = async (movie) => {
    const isBookmarked = watchlistIds.includes(movie.id);
    try {
      if (isBookmarked) {
        await api.delete(`/watchlist/${movie.id}`);
        setWatchlistIds(prev => prev.filter(id => id !== movie.id));
      } else {
        await api.post('/watchlist', {
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path
        });
        setWatchlistIds(prev => [...prev, movie.id]);
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err.message);
    }
  };

  const handlePlayTrailer = async (movieId, title) => {
    try {
      const res = await api.get(`/movies/${movieId}/videos`);
      if (res.data.success && res.data.data.results.length > 0) {
        const trailer = res.data.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || res.data.data.results[0];
        setTrailerKey(trailer.key);
      } else {
        setTrailerKey(null);
      }
      setTrailerTitle(title);
      setTrailerOpen(true);
    } catch (err) {
      console.error('Failed to resolve trailer key:', err.message);
      setTrailerTitle(title);
      setTrailerKey(null);
      setTrailerOpen(true);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedLanguage('');
    setSelectedYear('');
    setSortBy('popularity.desc');
    setPage(1);
    setSearchParams({});
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchParams(val ? { q: val } : {});
  };

  const FilterFormElements = () => (
    <div className="space-y-6">
      {/* 1. Sort options */}
      {!searchQuery && (
        <div>
          <label className="block mb-2 text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-600">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm rounded-xl border dark:bg-dark-surface light:bg-white dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
          >
            <option value="popularity.desc">Popularity (High → Low)</option>
            <option value="vote_average.desc">Rating (High → Low)</option>
            <option value="primary_release_date.desc">Release Date (New → Old)</option>
            <option value="title.asc">Title (A → Z)</option>
          </select>
        </div>
      )}

      {/* 2. Genres list select */}
      {!searchQuery && (
        <div>
          <label className="block mb-2 text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-600">
            Genre Filter
          </label>
          <select
            value={selectedGenre}
            onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm rounded-xl border dark:bg-dark-surface light:bg-white dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Language filter */}
      {!searchQuery && (
        <div>
          <label className="block mb-2 text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-600">
            Language Filter
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => { setSelectedLanguage(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm rounded-xl border dark:bg-dark-surface light:bg-white dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
          >
            <option value="">All Languages</option>
            {languagesList.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 4. Release Year */}
      {!searchQuery && (
        <div>
          <label className="block mb-2 text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-600">
            Release Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm rounded-xl border dark:bg-dark-surface light:bg-white dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
          >
            <option value="">Any Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {/* 5. Clean Triggers */}
      <button
        onClick={handleClearFilters}
        className="w-full py-2.5 text-xs font-bold border rounded-xl dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Search & Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Filter className="w-6 h-6 text-brand" /> Discover CineVerse
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Browse through categories, filter by metadata, or search titles.
          </p>
        </div>

        {/* Input field */}
        <div className="flex items-center space-x-2 w-full md:max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search movie titles..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full py-2 pl-10 pr-4 text-sm rounded-xl border dark:bg-dark-surface/80 light:bg-white dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
            />
            <Search className="absolute w-4 h-4 text-gray-400 left-3.5 top-3" />
          </div>
          
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2.5 border rounded-xl dark:border-dark-border light:border-light-border dark:bg-dark-surface light:bg-white md:hidden hover:bg-slate-500/10 text-brand"
            title="Filters drawer"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dual Column grid: Left Sidebar, Right Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Desktop Panel */}
        <aside className="hidden md:block md:col-span-1 p-5 border rounded-2xl h-fit glass-panel dark:border-dark-border light:border-light-border dark:bg-dark-surface/40 light:bg-white">
          <h3 className="font-bold text-sm mb-4 border-b dark:border-dark-border light:border-light-border pb-2 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-brand" /> Filters
          </h3>
          <FilterFormElements />
        </aside>

        {/* Right Movie Grid */}
        <section className="md:col-span-3 space-y-6">
          {loading ? (
            <MovieGridSkeleton count={12} />
          ) : movies.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    inWatchlist={watchlistIds.includes(movie.id)}
                    onWatchlistToggle={handleWatchlistToggle}
                    onPlayTrailer={handlePlayTrailer}
                  />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 pt-6 border-t dark:border-dark-border/40 light:border-light-border/40">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="p-2 border rounded-full dark:border-dark-border light:border-light-border dark:bg-dark-surface light:bg-white hover:bg-slate-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="p-2 border rounded-full dark:border-dark-border light:border-light-border dark:bg-dark-surface light:bg-white hover:bg-slate-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon="🔎"
              title="No Search Results Found"
              description="We couldn't find any movie matching your description. Try adjusting filters or search keywords."
              ctaText="Reset Discover deck"
              onCtaClick={handleClearFilters}
            />
          )}
        </section>
      </div>

      {/* Mobile Drawer panel */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-80 h-full p-6 border-l shadow-2xl overflow-y-auto dark:bg-dark-bg light:bg-light-bg dark:border-dark-border light:border-light-border"
            >
              <div className="flex items-center justify-between mb-6 pb-2 border-b dark:border-dark-border light:border-light-border">
                <h3 className="font-bold flex items-center gap-1.5 dark:text-dark-text light:text-light-text">
                  <SlidersHorizontal className="w-4 h-4 text-brand" /> Filter Cards
                </h3>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-full dark:text-dark-text light:text-light-text hover:bg-slate-500/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterFormElements />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Embedded trailer player */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeKey={trailerKey}
        movieTitle={trailerTitle}
      />

    </div>
  );
};

export default DiscoverPage;
