import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { MovieGridSkeleton } from '../components/LoadingSkeleton';

const GenresPage = () => {
  const [selectedGenre, setSelectedGenre] = useState(28); // default to Action
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState([]);

  // Trailer states
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerTitle, setTrailerTitle] = useState('');

  const genresList = [
    { id: 28, name: 'Action', emoji: '💥', bg: 'bg-red-500/10 border-red-500/20 text-red-500' },
    { id: 12, name: 'Adventure', emoji: '🗺️', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' },
    { id: 16, name: 'Animation', emoji: '🧸', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500' },
    { id: 35, name: 'Comedy', emoji: '😂', bg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' },
    { id: 80, name: 'Crime', emoji: '🕵️', bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' },
    { id: 99, name: 'Documentary', emoji: '📹', bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400' },
    { id: 18, name: 'Drama', emoji: '🎭', bg: 'bg-purple-500/10 border-purple-500/20 text-purple-500' },
    { id: 14, name: 'Fantasy', emoji: '🦄', bg: 'bg-pink-500/10 border-pink-500/20 text-pink-500' },
    { id: 27, name: 'Horror', emoji: '👻', bg: 'bg-orange-500/10 border-orange-500/20 text-orange-550' },
    { id: 9648, name: 'Mystery', emoji: '🔍', bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500' },
    { id: 10749, name: 'Romance', emoji: '💖', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-500' },
    { id: 878, name: 'Science Fiction', emoji: '🚀', bg: 'bg-blue-500/10 border-blue-500/20 text-blue-500' },
    { id: 53, name: 'Thriller', emoji: '🔪', bg: 'bg-rose-600/10 border-rose-600/20 text-rose-600' }
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
        console.error('Watchlist fetch error:', err.message);
      }
    };
    fetchWatchlist();
  }, []);

  // Fetch movies of selected genre
  useEffect(() => {
    const fetchGenreMovies = async () => {
      setLoading(true);
      try {
        const res = await api.get('/movies/discover', {
          params: { genre: selectedGenre, sortBy: 'popularity.desc' }
        });
        if (res.data.success) {
          setMovies(res.data.data.results || []);
        }
      } catch (err) {
        console.error('Genre movie query failure:', err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGenreMovies();
  }, [selectedGenre]);

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
      console.error('Trailer query failed:', err.message);
      setTrailerTitle(title);
      setTrailerKey(null);
      setTrailerOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Panel */}
      <div>
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          🎭 Browse by Genre
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Select movie categories to explore popular, trending, and top rated selections.
        </p>
      </div>

      {/* Genre Selector Buttons list */}
      <div className="flex flex-wrap gap-2.5">
        {genresList.map((genre) => {
          const active = selectedGenre === genre.id;
          return (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={`flex items-center px-4 py-2 border rounded-full text-xs font-bold transition-all duration-300 transform hover:scale-105
                ${active
                  ? 'bg-brand border-brand text-white shadow-glow'
                  : 'dark:border-dark-border light:border-light-border dark:bg-dark-surface light:bg-white dark:text-dark-text light:text-light-text hover:border-slate-500'
                }
              `}
            >
              <span className="mr-1.5">{genre.emoji}</span>
              <span>{genre.name}</span>
            </button>
          );
        })}
      </div>

      {/* Movie list matching genres */}
      <div className="space-y-4 pt-4 border-t dark:border-dark-border/40 light:border-light-border/40">
        <h3 className="text-lg font-black tracking-tight flex items-center gap-2 capitalize">
          🎬 Top {genresList.find(g => g.id === selectedGenre)?.name} Movies
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

      {/* Trailer video modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeKey={trailerKey}
        movieTitle={trailerTitle}
      />

    </div>
  );
};

export default GenresPage;
