import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Play, Bookmark, BookmarkCheck, Heart } from 'lucide-react';

const MovieCard = ({
  movie,
  inWatchlist = false,
  onWatchlistToggle = null,
}) => {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop'; // Film slate fallback

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  // Badges calculation
  const isTrending = movie.popularity > 120;
  const isTopRated = movie.vote_average >= 8;
  const isRecommended = movie.score !== undefined && movie.score >= 80;
  const isHiddenGem = movie.vote_average >= 7.8 && movie.vote_count < 1500;

  const handleWatchlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWatchlistToggle) {
      onWatchlistToggle(movie);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col h-full overflow-hidden transition-all duration-300 border rounded-2xl shadow-premium dark:bg-dark-surface/60 light:bg-light-surface dark:border-dark-border light:border-light-border group"
    >
      {/* Movie Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
        {isRecommended && (
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-emerald-500 text-white shadow-sm">
            ✨ {movie.score}% Match
          </span>
        )}
        {isTrending && !isRecommended && (
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-brand text-white shadow-sm">
            🔥 Trending
          </span>
        )}
        {isTopRated && !isRecommended && !isTrending && (
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-amber-500 text-white shadow-sm">
            ⭐ Top Rated
          </span>
        )}
        {isHiddenGem && (
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-cyan-500 text-white shadow-sm">
            💎 Gem
          </span>
        )}
      </div>

      {/* Quick Watchlist Toggle */}
      {onWatchlistToggle && (
        <button
          onClick={handleWatchlistClick}
          className="absolute p-2 transition-all duration-300 rounded-full right-2.5 top-2.5 z-10 bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-900 border border-white/10"
          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          {inWatchlist ? (
            <BookmarkCheck className="w-4 h-4 text-brand" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Poster Image Frame */}
      <Link to={`/movie/${movie.id}`} className="relative block aspect-[2/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={movie.title}
          loading="lazy"
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-0 bg-slate-950/60 group-hover:opacity-100">
          <span className="px-4 py-2 text-xs font-bold bg-white text-slate-950 rounded-full shadow-md group-hover:scale-105 transition-transform duration-200">
            View Details
          </span>
        </div>
      </Link>

      {/* Meta Text details */}
      <div className="flex flex-col flex-1 p-3.5">
        <Link to={`/movie/${movie.id}`} className="hover:text-brand">
          <h3 className="font-bold text-sm tracking-tight line-clamp-1 mb-1 dark:text-dark-text light:text-light-text">
            {movie.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-auto text-xs text-gray-400">
          <span>{year} • {movie.original_language ? movie.original_language.toUpperCase() : 'EN'}</span>
          
          <div className="flex items-center space-x-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span className="font-bold dark:text-gray-300 light:text-gray-700">{rating}</span>
          </div>
        </div>

        {/* Scoring reason explanation if recommended */}
        {movie.reason && (
          <p className="mt-2 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md line-clamp-1 border border-emerald-500/20">
            {movie.reason}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default MovieCard;
