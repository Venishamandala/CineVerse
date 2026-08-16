import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Compass, Sparkles, Languages, CheckCircle, Film, ArrowRight, Play, Star, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import TrailerModal from '../components/TrailerModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trailer modal states
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerTitle, setTrailerTitle] = useState('');

  useEffect(() => {
    const fetchLandingMovies = async () => {
      try {
        const [trendingRes, popularRes] = await Promise.all([
          api.get('/movies/trending'),
          api.get('/movies/popular')
        ]);
        if (trendingRes.data.success) setTrending(trendingRes.data.data.results.slice(0, 5));
        if (popularRes.data.success) setPopular(popularRes.data.data.results.slice(0, 8));
      } catch (err) {
        console.error('Failed to load landing page movies:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingMovies();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Force user to log in or register to search, or direct to login
      navigate(`/login?redirect=discover&q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const playTrailer = async (movieId, title) => {
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
      console.error('Failed to load trailer:', err.message);
      setTrailerTitle(title);
      setTrailerKey(null);
      setTrailerOpen(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  const featuredMovie = trending[0];

  return (
    <div className="min-h-screen dark:bg-dark-bg light:bg-light-bg dark:text-dark-text light:text-light-text transition-colors duration-300">
      
      {/* 1. Hero Spotlight Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-16 px-4">
        {featuredMovie?.backdrop_path && (
          <div className="absolute inset-0 z-0">
            <img
              src={`https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`}
              alt="Featured movie backdrop"
              className="object-cover w-full h-full opacity-20 filter blur-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-t dark:from-dark-bg light:from-light-bg via-transparent dark:to-dark-bg/60 light:to-light-bg/40" />
          </div>
        )}
        
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Recommendations</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-4xl sm:text-6xl font-black tracking-tight leading-none"
          >
            Discover Your Next<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-rose-400">
              Favorite Movie
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="max-w-2xl mx-auto text-sm sm:text-base text-gray-400 leading-relaxed"
          >
            Explore thousands of movies, discover hidden gems, and get recommendations tailored to your taste. Connect with real ratings, movie trailers, and watchlist managers.
          </motion.p>

          {/* Quick Search */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center max-w-lg mx-auto gap-3"
          >
            <input
              type="text"
              placeholder="Search movie titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 rounded-full border text-sm dark:bg-dark-surface/80 light:bg-white dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent shadow-md"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-brand text-white text-sm font-bold hover:bg-brand-hover shadow-glow flex items-center justify-center whitespace-nowrap"
            >
              Explore <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </motion.form>

          {/* Featured Title banner */}
          {featuredMovie && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              transition={{ delay: 0.6 }}
              className="pt-8 text-xs text-gray-500 uppercase tracking-widest flex items-center justify-center space-x-2"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Trending Spotlight: {featuredMovie.title} ({new Date(featuredMovie.release_date).getFullYear()})</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* 2. Trending Shelf */}
      <section className="py-12 border-t dark:border-dark-border light:border-light-border max-w-7xl mx-auto px-4 md:px-6">
        <h2 className="text-xl font-black mb-6 flex items-center tracking-tight">
          🔥 Trending Today
        </h2>

        {loading ? (
          <div className="flex space-x-4 overflow-x-auto py-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="w-48 aspect-[2/3] bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trending.map((movie) => (
              <div
                key={movie.id}
                onClick={() => playTrailer(movie.id, movie.title)}
                className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border dark:border-dark-border light:border-light-border group cursor-pointer"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h4 className="font-bold text-xs text-white line-clamp-1">{movie.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                    <span className="flex items-center"><Star className="w-3 h-3 text-amber-400 fill-current mr-0.5" />{movie.vote_average.toFixed(1)}</span>
                  </div>
                  <span className="mt-2 text-[9px] font-bold text-brand flex items-center">
                    <Play className="w-2.5 h-2.5 fill-current mr-1" /> PLAY TRAILER
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Core Features Section */}
      <section className="py-16 bg-slate-500/5 border-t border-b dark:border-dark-border light:border-light-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-black mb-3">Why CineVerse?</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              We leverage real database tracking and mathematical scoring matrices to customize recommendations to your taste, avoiding fake claims or static layouts.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Feature 1 */}
            <motion.div
              variants={itemVariants}
              className="p-6 border rounded-2xl dark:bg-dark-surface dark:border-dark-border light:bg-white light:border-light-border"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm mb-2">Personalized Recommendation Weights</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Our algorithm scores candidates using a balanced weight distribution: 30% Genres, 20% Languages, 25% Previous Ratings, and 15% Watchlist selections.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={itemVariants}
              className="p-6 border rounded-2xl dark:bg-dark-surface dark:border-dark-border light:bg-white light:border-light-border"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm mb-2">Real-Time TMDB Operations</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Connect live to TMDB core APIs. Look up over 800,000 titles, cast credits, similar recommendation networks, and official YouTube movie trailers.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={itemVariants}
              className="p-6 border rounded-2xl dark:bg-dark-surface dark:border-dark-border light:bg-white light:border-light-border"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm mb-2">Language & Genre Isolation</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Supports deep genre lists and 10 language categories including English, Hindi, Telugu, Tamil, Malayalam, Kannada, Korean, Japanese, Spanish, and French.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. Secondary popular showcase */}
      <section className="py-16 max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black flex items-center tracking-tight">
            🍿 Popular Discoveries
          </h2>
          <Link to="/register" className="text-xs font-bold text-brand hover:underline flex items-center">
            Sign up to rate these <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="aspect-[2/3] bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {popular.map((movie) => (
              <div
                key={movie.id}
                onClick={() => playTrailer(movie.id, movie.title)}
                className="relative aspect-[2/3] rounded-xl overflow-hidden shadow border dark:border-dark-border light:border-light-border cursor-pointer group"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                  alt={movie.title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay trigger */}
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                  <Play className="w-7 h-7 text-white fill-current" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. TMDB Credits Section */}
      <footer className="py-12 border-t dark:border-dark-border light:border-light-border dark:bg-dark-surface/20 light:bg-slate-200">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="flex justify-center items-center space-x-2">
            <span className="text-lg font-black tracking-tighter text-brand">CINEVERSE</span>
            <span className="text-xs text-gray-500">© 2026. Made as a premium portfolio presentation.</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t dark:border-dark-border/40 light:border-light-border/40 pt-6">
            {/* TMDB Logo sticker */}
            <div className="w-24 opacity-60">
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d53e74d59f7df1114d359b7e5e91d98a6a143d115015d862622403471997d4ea.svg"
                alt="TMDB Logo"
              />
            </div>
            <p className="text-[10px] text-gray-400 max-w-md text-left leading-relaxed">
              This product uses the TMDB API but is not endorsed or certified by TMDB. Movie posters, banners, ratings, titles, overview details, cast credits, and trailers are powered by TMDB.
            </p>
          </div>
        </div>
      </footer>

      {/* Embedded Trailer Player Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeKey={trailerKey}
        movieTitle={trailerTitle}
      />
      
    </div>
  );
};

export default LandingPage;
