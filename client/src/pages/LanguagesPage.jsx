import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { MovieGridSkeleton } from '../components/LoadingSkeleton';
import { Languages, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LanguagesPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState([]);

  // Trailer states
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerTitle, setTrailerTitle] = useState('');

  const languagesList = [
    { code: 'en', name: 'English', detail: 'US & UK Cinema', bg: 'from-blue-600 to-indigo-700' },
    { code: 'hi', name: 'Hindi', detail: 'Bollywood Hits', bg: 'from-orange-500 to-amber-600' },
    { code: 'te', name: 'Telugu', detail: 'Tollywood Cinema', bg: 'from-amber-600 to-yellow-700' },
    { code: 'ta', name: 'Tamil', detail: 'Kollywood Action', bg: 'from-red-600 to-rose-700' },
    { code: 'ml', name: 'Malayalam', detail: 'Mollywood Stories', bg: 'from-emerald-600 to-teal-700' },
    { code: 'kn', name: 'Kannada', detail: 'Sandalwood Movies', bg: 'from-purple-600 to-violet-700' },
    { code: 'ko', name: 'Korean', detail: 'K-Thriller & Art', bg: 'from-cyan-600 to-blue-700' },
    { code: 'ja', name: 'Japanese', detail: 'Anime & Classics', bg: 'from-pink-600 to-rose-700' },
    { code: 'es', name: 'Spanish', detail: 'Iberian & Latino', bg: 'from-red-500 to-orange-600' },
    { code: 'fr', name: 'French', detail: 'New Wave Drama', bg: 'from-blue-500 to-cyan-600' }
  ];

  // Fetch watchlist IDs on mount
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await api.get('/watchlist');
        if (res.data.success) {
          setWatchlistIds(res.data.data.map(w => w.movieId));
        }
      } catch (err) {
        console.error('Watchlist fetch failed:', err.message);
      }
    };
    fetchWatchlist();
  }, []);

  // Fetch movies of selected language
  useEffect(() => {
    const fetchLanguageMovies = async () => {
      setLoading(true);
      try {
        const res = await api.get('/movies/discover', {
          params: { language: selectedLanguage, sortBy: 'popularity.desc' }
        });
        if (res.data.success) {
          setMovies(res.data.data.results || []);
        }
      } catch (err) {
        console.error('Language movie query failure:', err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguageMovies();
  }, [selectedLanguage]);

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
      console.error('Watchlist save error:', err.message);
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
      console.error('Trailer play failed:', err.message);
      setTrailerTitle(title);
      setTrailerKey(null);
      setTrailerOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Info */}
      <div>
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Languages className="w-6 h-6 text-brand" /> Browse by Language
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Explore movies from different linguistic regions around the globe.
        </p>
      </div>

      {/* Language Selector Horizontal Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {languagesList.map((lang) => {
          const active = selectedLanguage === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`relative overflow-hidden p-4 text-left border rounded-2xl transition-all duration-300 group
                ${active
                  ? 'border-brand ring-1 ring-brand bg-brand/5 shadow-glow'
                  : 'dark:border-dark-border light:border-light-border dark:bg-dark-surface light:bg-white hover:border-slate-500'
                }
              `}
            >
              {/* Background gradient pill */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${lang.bg} opacity-10 filter blur-xl group-hover:scale-125 transition-transform duration-300`} />
              
              <div className="flex items-center space-x-2.5 mb-2">
                <Globe className={`w-4 h-4 ${active ? 'text-brand' : 'text-gray-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {lang.code.toUpperCase()}
                </span>
              </div>
              <h3 className="font-bold text-sm dark:text-dark-text light:text-light-text">
                {lang.name}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{lang.detail}</p>
            </button>
          );
        })}
      </div>

      {/* Dynamic Movie Grid Section */}
      <div className="space-y-4 pt-4 border-t dark:border-dark-border/40 light:border-light-border/40">
        <h3 className="text-lg font-black tracking-tight flex items-center gap-2 capitalize">
          🌟 Popular in {languagesList.find(l => l.code === selectedLanguage)?.name}
        </h3>

        {loading ? (
          <MovieGridSkeleton count={12} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
        )}
      </div>

      {/* Trailer modal player */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeKey={trailerKey}
        movieTitle={trailerTitle}
      />

    </div>
  );
};

export default LanguagesPage;
