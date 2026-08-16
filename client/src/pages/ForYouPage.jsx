import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { MovieGridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { Sparkles, HelpCircle } from 'lucide-react';

const ForYouPage = () => {
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Trailer modal
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerTitle, setTrailerTitle] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, watchlistRes] = await Promise.all([
        api.get('/recommendations'),
        api.get('/watchlist')
      ]);

      if (recRes.data.success) {
        setRecommendations(recRes.data.data);
      }
      if (watchlistRes.data.success) {
        setWatchlistIds(watchlistRes.data.data.map(w => w.movieId));
      }
    } catch (err) {
      console.error('Failed to load recommendation details:', err.message);
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
      console.error('Failed to modify watchlist item:', err.message);
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
      console.error('Trailer loading failure:', err.message);
      setTrailerTitle(title);
      setTrailerKey(null);
      setTrailerOpen(true);
    }
  };

  const handleRedirection = () => {
    navigate('/onboarding');
  };

  return (
    <div className="space-y-6">
      
      {/* Header text */}
      <div>
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand" /> For You - CineVerse Insights
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Personalized movie deck calculated using your favorite genres, preferred languages, and rating feedback.
        </p>
      </div>

      {loading ? (
        <MovieGridSkeleton count={10} />
      ) : recommendations.length > 0 ? (
        <div className="space-y-8">
          
          {/* Explanation Callout card */}
          <div className="p-4 border rounded-2xl dark:bg-dark-surface/40 light:bg-slate-100 dark:border-dark-border light:border-light-border flex items-start space-x-3 text-xs leading-relaxed text-gray-400 max-w-2xl">
            <HelpCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold dark:text-dark-text light:text-light-text mb-1">
                How is my recommendation score calculated?
              </p>
              We look up candidates across popular, top rated, and trending indices. Then we apply a weights matrix: <strong>Genre overlap (30%)</strong>, <strong>Language matching (20%)</strong>, <strong>Similarities to your 4+ star ratings (25%)</strong>, and <strong>Watchlist similarity (15%)</strong>. Movies you already rated or watched are automatically filtered out.
            </div>
          </div>

          {/* Recommendations Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recommendations.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                inWatchlist={watchlistIds.includes(movie.id)}
                onWatchlistToggle={handleWatchlistToggle}
                onPlayTrailer={handlePlayTrailer}
              />
            ))}
          </div>

        </div>
      ) : (
        <EmptyState
          icon="✨"
          title="No Recommendations Available"
          description="Your recommendation parameters are blank. Rate a few movies or update preferred languages/genres to launch calculations."
          ctaText="Configure Preferences"
          onCtaClick={handleRedirection}
        />
      )}

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

export default ForYouPage;
