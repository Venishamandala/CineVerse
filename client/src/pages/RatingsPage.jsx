import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import RatingStars from '../components/RatingStars';
import EmptyState from '../components/EmptyState';
import { MovieGridSkeleton } from '../components/LoadingSkeleton';
import { Star, Trash2, Search, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const RatingsPage = () => {
  const navigate = useNavigate();

  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ratings');
      if (res.data.success) {
        setRatings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load user ratings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handleRatingChange = async (movieId, movieTitle, posterPath, newRating) => {
    try {
      const res = await api.post('/ratings', {
        movieId,
        movieTitle,
        posterPath,
        rating: newRating
      });
      if (res.data.success) {
        setRatings(prev =>
          prev.map(r => (r.movieId === movieId ? { ...r, rating: newRating } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update rating:', err.message);
    }
  };

  const handleDelete = async (movieId) => {
    try {
      const res = await api.delete(`/ratings/${movieId}`);
      if (res.data.success) {
        setRatings(prev => prev.filter(r => r.movieId !== movieId));
      }
    } catch (err) {
      console.error('Failed to delete rating:', err.message);
    }
  };

  const handleRedirect = () => {
    navigate('/discover');
  };

  const filteredRatings = ratings.filter(item =>
    item.movieTitle.toLowerCase().includes(localSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-brand" /> My Ratings
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Browse and manage ratings you've logged across your film history.
          </p>
        </div>

        {/* Local Search input */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search within ratings..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full py-1.5 pl-10 pr-4 text-xs rounded-xl border dark:bg-dark-surface/80 light:bg-white dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
          />
          <Search className="absolute w-3.5 h-3.5 text-gray-400 left-3.5 top-2.5" />
        </div>
      </div>

      {/* Main content grid */}
      {loading ? (
        <MovieGridSkeleton count={6} />
      ) : ratings.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="No Movie Ratings Yet"
          description="Rate movies to kickstart CineVerse recommended algorithms and personalize suggestions."
          ctaText="Explore Movies"
          onCtaClick={handleRedirect}
        />
      ) : filteredRatings.length === 0 ? (
        <EmptyState
          icon="🔎"
          title="No Ratings Found"
          description="Try adjusting your text search keywords."
          ctaText="Show All Ratings"
          onCtaClick={() => setLocalSearch('')}
        />
      ) : (
        /* Ratings items listing */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRatings.map((item) => {
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

                {/* Info Column */}
                <div className="flex flex-col justify-between flex-1 ml-4 py-1">
                  <div>
                    <h3 className="font-bold text-sm dark:text-dark-text light:text-light-text line-clamp-1">
                      {item.movieTitle}
                    </h3>
                    <span className="text-[10px] text-gray-450 flex items-center mt-0.5">
                      <Calendar className="w-3 h-3 mr-1" />
                      Rated {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Rating Stars Adjuster & actions */}
                  <div className="flex items-center justify-between mt-4">
                    <RatingStars
                      rating={item.rating}
                      onChange={(val) => handleRatingChange(item.movieId, item.movieTitle, item.posterPath, val)}
                      size={4.5}
                    />

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(item.movieId)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Delete Rating"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/movie/${item.movieId}`}
                        className="p-1 text-brand hover:underline"
                        title="Details page"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
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

export default RatingsPage;
