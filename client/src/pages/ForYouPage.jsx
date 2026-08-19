import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { MovieGridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { Sparkles, HelpCircle, Activity, Cpu, Percent } from 'lucide-react';

const ForYouPage = () => {
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [metrics, setMetrics] = useState(null);
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
        setMetrics(recRes.data.metrics || null);
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
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Area */}
          <div className="flex-1 space-y-6">
            
            {/* Explanation Callout card */}
            <div className="p-4 border rounded-2xl dark:bg-dark-surface/40 light:bg-slate-100 dark:border-dark-border light:border-light-border flex items-start space-x-3 text-xs leading-relaxed text-gray-400">
              <HelpCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold dark:text-dark-text light:text-light-text mb-1">
                  How is my recommendation score calculated?
                </p>
                We train a custom <strong>Decision Tree Regressor</strong> and a <strong>Random Forest Regressor</strong> on your rating log, watchlist, and preferred onboarding genres. These tree-based models learn features like genre overlap, language matching, and popularity to predict your exact percentage match.
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

          {/* Diagnostics Sidebar */}
          {metrics && (
            <div className="w-full lg:w-80 space-y-4 flex-shrink-0">
              <div className="p-5 border rounded-2xl dark:bg-dark-surface/60 light:bg-white dark:border-dark-border light:border-light-border shadow-premium glass-panel space-y-5">
                <div className="flex items-center gap-2 border-b dark:border-dark-border light:border-light-border pb-3">
                  <Activity className="w-5 h-5 text-brand" />
                  <div>
                    <h3 className="font-black text-sm dark:text-dark-text light:text-light-text">
                      Model Diagnostics
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Real-time training metrics
                    </p>
                  </div>
                </div>

                {/* Metrics list with progress bars */}
                <div className="space-y-4">
                  
                  {/* Accuracy */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold dark:text-gray-300">
                      <span>Model Accuracy</span>
                      <span className="text-brand font-black">{metrics.accuracy}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${metrics.accuracy}%` }} 
                      />
                    </div>
                  </div>

                  {/* F1 Score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold dark:text-gray-300">
                      <span>F1-Score</span>
                      <span className="text-brand font-black">{metrics.f1_score}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                        style={{ width: `${metrics.f1_score}%` }} 
                      />
                    </div>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] border-t dark:border-dark-border light:border-light-border">
                    <div className="p-2 border rounded-xl dark:border-dark-border dark:bg-dark-bg/40">
                      <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Precision</p>
                      <p className="font-extrabold text-sm dark:text-dark-text">{metrics.precision}%</p>
                    </div>
                    <div className="p-2 border rounded-xl dark:border-dark-border dark:bg-dark-bg/40">
                      <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Recall</p>
                      <p className="font-extrabold text-sm dark:text-dark-text">{metrics.recall}%</p>
                    </div>
                  </div>

                  <div className="p-3 border rounded-xl dark:border-dark-border dark:bg-dark-bg/30 text-[11px] flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Mean Squared Error (MSE)</p>
                      <code className="text-brand font-mono font-bold">{metrics.mse}</code>
                    </div>
                    <Percent className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </div>

                </div>

                {/* Model Configuration Information */}
                <div className="border-t dark:border-dark-border light:border-light-border pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold dark:text-gray-300">
                    <Cpu className="w-4 h-4 text-brand" />
                    <span>Configuration Parameters</span>
                  </div>
                  
                  <div className="space-y-2 text-[10px] text-gray-400">
                    <div className="flex justify-between">
                      <span>Forest Size</span>
                      <span className="font-mono font-bold dark:text-dark-text">10 estimators</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Depth</span>
                      <span className="font-mono font-bold dark:text-dark-text">5 levels</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feature Size</span>
                      <span className="font-mono font-bold dark:text-dark-text">25 variables</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Split Criterion</span>
                      <span className="font-mono font-bold dark:text-dark-text">Variance Reduction</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

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
