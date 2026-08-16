import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import RatingStars from '../components/RatingStars';
import TrailerModal from '../components/TrailerModal';
import MovieCarousel from '../components/MovieCarousel';
import { MovieDetailsSkeleton } from '../components/LoadingSkeleton';
import { Play, Bookmark, BookmarkCheck, Star, Calendar, Clock, Globe, ArrowLeft, Heart, Film } from 'lucide-react';
import { motion } from 'framer-motion';

const MovieDetailsPage = () => {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  // Watchlist & Rating user stats
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // Trailer states
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);

  // General watchlist check list for Similar movie child components
  const [watchlistIds, setWatchlistIds] = useState([]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const movieId = Number(id);
      const [movieRes, creditsRes, similarRes, watchlistStatusRes, ratingStatusRes, watchlistRes] = await Promise.all([
        api.get(`/movies/${movieId}`),
        api.get(`/movies/${movieId}/credits`),
        api.get(`/movies/${movieId}/similar`),
        api.get(`/watchlist/${movieId}/check`),
        api.get(`/ratings/${movieId}`),
        api.get('/watchlist')
      ]);

      if (movieRes.data.success) setMovie(movieRes.data.data);
      if (creditsRes.data.success) setCredits(creditsRes.data.data);
      if (similarRes.data.success) setSimilar(similarRes.data.data.results || []);
      if (watchlistStatusRes.data.success) {
        setInWatchlist(watchlistStatusRes.data.inWatchlist);
        setIsWatched(watchlistStatusRes.data.watched);
      }
      if (ratingStatusRes.data.success) {
        setUserRating(ratingStatusRes.data.rating || 0);
      }
      if (watchlistRes.data.success) {
        setWatchlistIds(watchlistRes.data.data.map(w => w.movieId));
      }

      // Fetch trailers key
      const videoRes = await api.get(`/movies/${movieId}/videos`);
      if (videoRes.data.success && videoRes.data.data.results.length > 0) {
        const trailer = videoRes.data.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videoRes.data.data.results[0];
        setTrailerKey(trailer.key);
      } else {
        setTrailerKey(null);
      }
    } catch (err) {
      console.error('Failed to load movie details page:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  const handleWatchlistToggle = async () => {
    try {
      if (inWatchlist) {
        const res = await api.delete(`/watchlist/${movie.id}`);
        if (res.data.success) {
          setInWatchlist(false);
          setWatchlistIds(prev => prev.filter(gid => gid !== movie.id));
        }
      } else {
        const res = await api.post('/watchlist', {
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path
        });
        if (res.data.success) {
          setInWatchlist(true);
          setWatchlistIds(prev => [...prev, movie.id]);
        }
      }
    } catch (err) {
      console.error('Watchlist modify failed:', err.message);
    }
  };

  const handleToggleWatched = async () => {
    try {
      const res = await api.patch(`/watchlist/${movie.id}/watched`, {
        watched: !isWatched
      });
      if (res.data.success) {
        setIsWatched(res.data.data.watched);
      }
    } catch (err) {
      console.error('Toggle watched state failed:', err.message);
    }
  };

  const handleRatingSubmit = async (ratingVal) => {
    try {
      if (ratingVal === userRating) {
        // Toggle/remove rating if double clicked
        const res = await api.delete(`/ratings/${movie.id}`);
        if (res.data.success) {
          setUserRating(0);
        }
      } else {
        const res = await api.post('/ratings', {
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path,
          rating: ratingVal
        });
        if (res.data.success) {
          setUserRating(ratingVal);
        }
      }
    } catch (err) {
      console.error('Rating post failed:', err.message);
    }
  };

  if (loading) {
    return <MovieDetailsSkeleton />;
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <span className="text-6xl">⚠️</span>
        <h3 className="text-xl font-bold">Movie not found</h3>
        <Link to="/dashboard" className="text-brand font-bold flex items-center hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop';
  
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';

  const directors = credits?.crew?.filter(c => c.job === 'Director') || [];
  const starsCast = credits?.cast?.slice(0, 8) || [];

  return (
    <div className="space-y-10">
      
      {/* 1. Large Cinematic Backdrop Image */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border dark:border-dark-border light:border-light-border bg-slate-950 h-72 sm:h-96 md:h-[450px]">
        <img src={backdropUrl} alt={movie.title} className="absolute inset-0 object-cover w-full h-full opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t dark:from-dark-bg light:from-light-bg via-transparent to-transparent" />
        
        {/* Back navigation button */}
        <Link
          to="/dashboard"
          className="absolute top-4 left-4 p-2.5 rounded-full bg-slate-900/60 backdrop-blur-md text-white border border-white/10 hover:bg-slate-950 hover:scale-105 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* 2. Grid Info: Left Poster Panel, Right details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-24 sm:-mt-32 md:-mt-48 relative z-10 px-4 sm:px-6">
        
        {/* Left Column: Movie Poster */}
        <div className="flex flex-col items-center md:items-stretch space-y-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="aspect-[2/3] w-48 sm:w-60 md:w-full rounded-2xl overflow-hidden border dark:border-dark-border light:border-light-border shadow-2xl bg-slate-900"
          >
            <img src={posterUrl} alt={movie.title} className="object-cover w-full h-full" />
          </motion.div>

          {/* Rate and Watched Panel */}
          <div className="w-full p-4 border rounded-2xl glass-panel dark:border-dark-border light:border-light-border dark:bg-dark-surface/60 light:bg-white text-center space-y-4 shadow-md">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Rate this movie
              </p>
              <div className="flex justify-center">
                <RatingStars rating={userRating} onChange={handleRatingSubmit} size={6} />
              </div>
              {userRating > 0 && (
                <p className="text-[10px] text-emerald-500 font-bold mt-1">
                  You rated this movie {userRating} ★
                </p>
              )}
            </div>

            {/* Watched toggle checklist */}
            <div className="flex items-center justify-center pt-2 border-t dark:border-dark-border/40 light:border-light-border/40">
              <button
                onClick={handleToggleWatched}
                className={`flex items-center space-x-2 text-xs font-bold px-4 py-2 rounded-full border transition-all duration-300
                  ${isWatched
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                    : 'bg-slate-900/10 dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30'
                  }
                `}
              >
                <CheckCircleIcon active={isWatched} />
                <span>{isWatched ? 'Watched' : 'Mark as Watched'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Title Info Metadata */}
        <div className="md:col-span-2 space-y-6 pt-16 md:pt-40">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-dark-text light:text-light-text">
              {movie.title}
            </h2>
            
            {/* Meta Tags rows */}
            <div className="flex flex-wrap items-center gap-3.5 text-xs text-gray-400">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" /> {movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" /> {movie.runtime ? `${movie.runtime} min` : 'N/A'}
              </span>
              <span className="flex items-center">
                <Globe className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {movie.original_language ? movie.original_language.toUpperCase() : 'EN'}
              </span>
              <span className="flex items-center">
                <Star className="w-3.5 h-3.5 mr-1 text-amber-400 fill-current" /> {movie.vote_average ? `${movie.vote_average.toFixed(1)} / 10` : 'N/A'}
              </span>
            </div>

            {/* Genre tags pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {movie.genres?.map(g => (
                <span key={g.id} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider dark:bg-dark-surface dark:border-dark-border light:bg-slate-200 border border-transparent dark:text-dark-text light:text-light-text">
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          {/* Action Row buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setTrailerOpen(true)}
              className="px-6 py-3 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-full flex items-center shadow-glow"
            >
              <Play className="w-4 h-4 mr-2 fill-current" /> Play Trailer
            </button>
            
            <button
              onClick={handleWatchlistToggle}
              className={`px-6 py-3 border text-xs font-bold rounded-full flex items-center transition-all duration-300
                ${inWatchlist
                  ? 'bg-slate-900 border-white/10 text-white'
                  : 'bg-white/10 border-white/15 dark:hover:bg-white/20 hover:bg-slate-100 text-slate-800 dark:text-white'
                }
              `}
            >
              {inWatchlist ? (
                <>
                  <BookmarkCheck className="w-4 h-4 mr-2 text-brand" /> In Watchlist
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 mr-2" /> Add to Watchlist
                </>
              )}
            </button>
          </div>

          {/* Watch Providers (Streaming On) */}
          {movie.watch_providers && (movie.watch_providers.IN || movie.watch_providers.US || Object.keys(movie.watch_providers).length > 0) && (
            <div className="space-y-3 pt-4 border-t dark:border-dark-border/40 light:border-light-border/40">
              <h4 className="text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-650 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand" /> Available to Stream On:
              </h4>
              <div className="flex flex-wrap gap-3">
                {(() => {
                  const countryData = movie.watch_providers.IN || movie.watch_providers.US || Object.values(movie.watch_providers)[0];
                  const providers = countryData?.flatrate || countryData?.buy || countryData?.rent || [];
                  
                  if (providers.length === 0) {
                    return (
                      <span className="text-xs text-gray-550 italic">
                        Available on local rental stores or physical media only.
                      </span>
                    );
                  }
                  
                  return providers.map((provider) => (
                    <div
                      key={provider.provider_id || provider.provider_name}
                      className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-full hover:scale-105 transition-all shadow-sm"
                    >
                      {provider.logo_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="w-5 h-5 rounded-md object-cover"
                        />
                      ) : (
                        <Globe className="w-5 h-5 text-gray-500" />
                      )}
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        {provider.provider_name}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Synopsis */}
          <div className="space-y-2 border-t dark:border-dark-border/40 light:border-light-border/40 pt-5">
            <h4 className="text-sm font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-700">
              Overview
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              {movie.overview || 'No synopsis description is available for this title.'}
            </p>
          </div>

          {/* Director & Production */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <p className="font-bold text-gray-400 uppercase tracking-widest mb-1">Director</p>
              <p className="font-semibold dark:text-dark-text light:text-light-text">
                {directors.map(d => d.name).join(', ') || 'Unknown'}
              </p>
            </div>
            {movie.production_companies?.length > 0 && (
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-widest mb-1">Production</p>
                <p className="font-semibold dark:text-dark-text light:text-light-text line-clamp-1">
                  {movie.production_companies[0].name}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. Cast Members scroll listing */}
      {starsCast.length > 0 && (
        <div className="space-y-4 px-4 sm:px-6">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            👥 Top Cast
          </h3>
          <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
            {starsCast.map((cast) => {
              const avatarUrl = cast.profile_path
                ? `https://image.tmdb.org/t/p/w185${cast.profile_path}`
                : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'; // fallback boy avatar
              return (
                <div key={cast.id} className="w-24 flex-shrink-0 text-center space-y-1.5">
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto shadow-md border dark:border-dark-border light:border-light-border bg-slate-800">
                    <img src={avatarUrl} alt={cast.name} className="object-cover w-full h-full" />
                  </div>
                  <p className="text-xs font-bold dark:text-dark-text light:text-light-text line-clamp-1">{cast.name}</p>
                  <p className="text-[10px] text-gray-400 line-clamp-1">{cast.character}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Similar Recommendations rail */}
      {similar.length > 0 && (
        <div className="space-y-4 px-4 sm:px-6 border-t dark:border-dark-border/40 light:border-light-border/40 pt-8">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            🎬 Similar Movies
          </h3>
          <MovieCarousel
            movies={similar}
            watchlistIds={watchlistIds}
            onWatchlistToggle={async (m) => {
              // Toggle watchlist item from carousel card click
              const index = watchlistIds.indexOf(m.id);
              try {
                if (index !== -1) {
                  await api.delete(`/watchlist/${m.id}`);
                  setWatchlistIds(prev => prev.filter(id => id !== m.id));
                } else {
                  await api.post('/watchlist', {
                    movieId: m.id,
                    movieTitle: m.title,
                    posterPath: m.poster_path
                  });
                  setWatchlistIds(prev => [...prev, m.id]);
                }
              } catch (e) {
                console.error(e.message);
              }
            }}
            onPlayTrailer={async (mId, mTitle) => {
              // Play trailer from similar movie carousel card click
              try {
                const res = await api.get(`/movies/${mId}/videos`);
                if (res.data.success && res.data.data.results.length > 0) {
                  const trailer = res.data.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || res.data.data.results[0];
                  setTrailerKey(trailer.key);
                } else {
                  setTrailerKey(null);
                }
                setTrailerOpen(true);
              } catch (e) {
                setTrailerKey(null);
                setTrailerOpen(true);
              }
            }}
          />
        </div>
      )}

      {/* Trailer modal video iframe */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeKey={trailerKey}
        movieTitle={movie.title}
      />

    </div>
  );
};

// Check circle icon helper
const CheckCircleIcon = ({ active }) => (
  <svg
    className={`w-4 h-4 transition-colors ${active ? 'text-emerald-500 fill-current' : 'text-gray-400'}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

export default MovieDetailsPage;
