import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieCarousel = ({
  movies = [],
  watchlistIds = [],
  onWatchlistToggle = null,
}) => {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollOffset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      carouselRef.current.scrollTo({
        left: scrollLeft + scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  if (!movies || movies.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-500">
        No movies available.
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-[40%] z-10 p-2 text-white bg-slate-900/75 border border-white/10 rounded-full shadow-premium hover:bg-brand transition-all duration-200 opacity-0 group-hover:opacity-100 hidden md:block"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Carousel Rail */}
      <div
        ref={carouselRef}
        className="flex space-x-4 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
      >
        {movies.map((movie) => (
          <div key={movie.id} className="w-44 md:w-52 flex-shrink-0">
            <MovieCard
              movie={movie}
              inWatchlist={watchlistIds.includes(movie.id)}
              onWatchlistToggle={onWatchlistToggle}
            />
          </div>
        ))}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-[40%] z-10 p-2 text-white bg-slate-900/75 border border-white/10 rounded-full shadow-premium hover:bg-brand transition-all duration-200 opacity-0 group-hover:opacity-100 hidden md:block"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MovieCarousel;
