import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MovieCarousel from '../components/MovieCarousel';
import TrailerModal from '../components/TrailerModal';
import { MovieCardSkeleton } from '../components/LoadingSkeleton';
import { Film, Sparkles, TrendingUp, Calendar, Trophy, Bookmark, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardPage = () => {
  const { user } = useAuth();

  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Trailer modal states
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerTitle, setTrailerTitle] = useState('');

  // Fetch all collections in parallel
  const fetchData = async () => {
    try {
      const [trendingRes, popularRes, topRatedRes, upcomingRes, recRes, watchlistRes] = await Promise.all([
        api.get('/movies/trending'),
        api.get('/movies/popular'),
        api.get('/movies/top-rated'),
        api.get('/movies/upcoming'),
        api.get('/recommendations').catch(() => ({ data: { success: false } })), // handle new user failures
        api.get('/watchlist')
      ]);

      if (trendingRes.data.success) setTrending(trendingRes.data.data.results);
      if (popularRes.data.success) setPopular(popularRes.data.data.results);
      if (topRatedRes.data.success) setTopRated(topRatedRes.data.data.results);
      if (upcomingRes.data.success) setUpcoming(upcomingRes.data.data.results);
      if (recRes.data?.success) setRecommendations(recRes.data.data);
      if (watchlistRes.data.success) {
        setWatchlist(watchlistRes.data.data);
        setWatchlistIds(watchlistRes.data.data.map(w => w.movieId));
      }
    } catch (error) {
      console.error('Failed to load dashboard statistics:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWatchlistToggle = async (movie) => {
    const isBookmarked = watchlistIds.includes(movie.id);
    try {
      if (isBookmarked) {
        const res = await api.delete(`/watchlist/${movie.id}`);
        if (res.data.success) {
          setWatchlistIds(prev => prev.filter(id => id !== movie.id));
        }
      } else {
        const res = await api.post('/watchlist', {
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path
        });
        if (res.data.success) {
          setWatchlistIds(prev => [...prev, movie.id]);
        }
      }
    } catch (err) {
      console.error('Watchlist toggle failed:', err.message);
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
      console.error('Trailer lookup failed:', err.message);
      setTrailerTitle(title);
      setTrailerKey(null);
      setTrailerOpen(true);
    }
  };

  // Select a random movie from trending to display as featured banner
  const featuredMovie = trending[0];

  return (
    <div className="space-y-10">
      
      {/* 1. Large Spotlight Hero */}
      {featuredMovie && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border dark:border-dark-border light:border-light-border bg-slate-900 aspect-video max-h-96 w-full"
        >
          <img
            src={`https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`}
            alt={featuredMovie.title}
            className="absolute inset-0 object-cover w-full h-full opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t dark:from-dark-bg light:from-light-bg via-transparent to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 space-y-3 max-w-2xl">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-bold uppercase tracking-wider">
              🔥 SPOTLIGHT MOVIE
            </span>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-none">
              {featuredMovie.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
              {featuredMovie.overview}
            </p>
            
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => handlePlayTrailer(featuredMovie.id, featuredMovie.title)}
                className="px-5 py-2.5 bg-brand text-white text-xs font-bold rounded-full hover:bg-brand-hover flex items-center shadow-glow"
              >
                <Film className="w-3.5 h-3.5 mr-2 fill-current" /> Play Trailer
              </button>
              <button
                onClick={() => handleWatchlistToggle(featuredMovie)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold rounded-full flex items-center"
              >
                <Bookmark className={`w-3.5 h-3.5 mr-2 ${watchlistIds.includes(featuredMovie.id) ? 'text-brand fill-current' : ''}`} />
                {watchlistIds.includes(featuredMovie.id) ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-10 py-6">
          <div className="h-44 dark:bg-slate-800 rounded-3xl animate-pulse" />
          {[1, 2].map((s) => (
            <div key={s} className="space-y-4">
              <div className="h-6 w-48 dark:bg-slate-800 rounded animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => <MovieCardSkeleton key={i} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* A. Watchlist Continue Watching */}
          {watchlist.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-brand" /> Continue Exploring (Your Watchlist)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {watchlist.slice(0, 6).map((item) => (
                  <div key={item.movieId} className="w-full">
                    {/* Dummy map items to movie layout */}
                    <MovieCarousel
                      movies={[{ id: item.movieId, title: item.movieTitle, poster_path: item.posterPath }]}
                      watchlistIds={watchlistIds}
                      onWatchlistToggle={handleWatchlistToggle}
                      onPlayTrailer={handlePlayTrailer}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* B. Recommendations Rail */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" /> Recommended For You
              </h3>
              <MovieCarousel
                movies={recommendations}
                watchlistIds={watchlistIds}
                onWatchlistToggle={handleWatchlistToggle}
                onPlayTrailer={handlePlayTrailer}
              />
            </div>
          )}

          {/* C. Trending Now */}
          <div className="space-y-3">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" /> Trending Now
            </h3>
            <MovieCarousel
              movies={trending}
              watchlistIds={watchlistIds}
              onWatchlistToggle={handleWatchlistToggle}
              onPlayTrailer={handlePlayTrailer}
            />
          </div>

          {/* D. Popular Movies */}
          <div className="space-y-3">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand" /> Popular Movies
            </h3>
            <MovieCarousel
              movies={popular}
              watchlistIds={watchlistIds}
              onWatchlistToggle={handleWatchlistToggle}
              onPlayTrailer={handlePlayTrailer}
            />
          </div>

          {/* E. Top Rated */}
          <div className="space-y-3">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Star className="w-5 h-5 text-brand" /> Top Rated Films
            </h3>
            <MovieCarousel
              movies={topRated}
              watchlistIds={watchlistIds}
              onWatchlistToggle={handleWatchlistToggle}
              onPlayTrailer={handlePlayTrailer}
            />
          </div>

          {/* F. Upcoming Releases */}
          <div className="space-y-3">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" /> Upcoming Releases
            </h3>
            <MovieCarousel
              movies={upcoming}
              watchlistIds={watchlistIds}
              onWatchlistToggle={handleWatchlistToggle}
              onPlayTrailer={handlePlayTrailer}
            />
          </div>

        </div>
      )}

      {/* Trailer Modal Player */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeKey={trailerKey}
        movieTitle={trailerTitle}
      />

    </div>
  );
};

export default DashboardPage;
