import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import { MovieGridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { BrainCircuit, Sparkles, Send, Globe, Activity, Cpu, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AISuggesterPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedMood, setSelectedMood] = useState('happy');
  const [selectedContext, setSelectedContext] = useState('alone');
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [typingMessage, setTypingMessage] = useState('');
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const languages = [
    { id: 'en', name: 'English', emoji: '🇺🇸' },
    { id: 'hi', name: 'Hindi', emoji: '🇮🇳' },
    { id: 'te', name: 'Telugu', emoji: '🇮🇳' },
    { id: 'ta', name: 'Tamil', emoji: '🇮🇳' },
    { id: 'ko', name: 'Korean', emoji: '🇰🇷' },
    { id: 'ja', name: 'Japanese', emoji: '🇯🇵' },
    { id: 'es', name: 'Spanish', emoji: '🇪🇸' },
    { id: 'fr', name: 'French', emoji: '🇫🇷' }
  ];

  const moods = [
    { id: 'happy', name: 'Happy / Uplifting', emoji: '😂' },
    { id: 'melancholy', name: 'Melancholy / Emotional', emoji: '🎭' },
    { id: 'thrill', name: 'Thrill / Adrenaline', emoji: '👻' },
    { id: 'deep', name: 'Thought-Provoking', emoji: '🚀' },
    { id: 'relaxed', name: 'Relaxed / Cozy', emoji: '💖' }
  ];

  const contexts = [
    { id: 'alone', name: 'Alone / Solo', emoji: '👤' },
    { id: 'date', name: 'Date Night', emoji: '🕯️' },
    { id: 'family', name: 'Family Night', emoji: '🍿' },
    { id: 'friends', name: 'With Friends', emoji: '👥' }
  ];

  // Fetch watchlist and model metrics on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [watchlistRes, recRes] = await Promise.all([
          api.get('/watchlist'),
          api.get('/recommendations')
        ]);
        
        if (watchlistRes.data.success) {
          setWatchlistIds(watchlistRes.data.data.map(w => w.movieId));
        }
        if (recRes.data.success) {
          setMetrics(recRes.data.metrics || null);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err.message);
      }
    };
    fetchData();
  }, []);

  // Text typing effect simulation
  useEffect(() => {
    if (!aiMessage) return;
    setTypingMessage('');
    let i = 0;
    const interval = setInterval(() => {
      setTypingMessage((prev) => prev + aiMessage.charAt(i));
      i++;
      if (i >= aiMessage.length) {
        clearInterval(interval);
      }
    }, 12); // character speed

    return () => clearInterval(interval);
  }, [aiMessage]);

  const handleAskAI = async () => {
    setLoading(true);
    setAiMessage('');
    setTypingMessage('');
    try {
      const res = await api.get('/recommendations/mood', {
        params: { 
          mood: selectedMood, 
          context: selectedContext,
          language: selectedLanguage 
        }
      });
      if (res.data.success) {
        setMovies(res.data.data || []);
        setAiMessage(res.data.message);
        setMetrics(res.data.metrics || null);
      }
    } catch (err) {
      console.error('AI Query failed:', err.message);
      setAiMessage('🤖 System Warning: Failed to query recommendation server. Please check your internet connectivity.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-8">
      
      {/* Header Panel */}
      <div>
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-brand" /> AI Situation Suggester
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Tell our custom AI what situation you are in and receive live-scanned matching film recommendations.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* Main interactive form card */}
          <div className="p-6 border rounded-3xl dark:bg-dark-surface/40 light:bg-white dark:border-dark-border light:border-light-border space-y-6 shadow-premium">
            
            {/* Step 1: Language selection row */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-650 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand" /> 1. Select Preferred Language
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {languages.map((lang) => {
                  const active = selectedLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`flex items-center px-4 py-2 border rounded-full text-xs font-bold transition-all duration-200 transform hover:scale-105
                        ${active
                          ? 'bg-brand border-brand text-white shadow-glow'
                          : 'dark:border-dark-border light:border-light-border dark:bg-dark-bg light:bg-slate-100 dark:text-dark-text light:text-light-text hover:border-slate-500'
                        }
                      `}
                    >
                      <span className="mr-1.5">{lang.emoji}</span>
                      <span>{lang.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Mood select row */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-650 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand" /> 2. Select Your Current Vibe
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {moods.map((mood) => {
                  const active = selectedMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex items-center px-4 py-2 border rounded-full text-xs font-bold transition-all duration-200 transform hover:scale-105
                        ${active
                          ? 'bg-brand border-brand text-white shadow-glow'
                          : 'dark:border-dark-border light:border-light-border dark:bg-dark-bg light:bg-slate-100 dark:text-dark-text light:text-light-text hover:border-slate-500'
                        }
                      `}
                    >
                      <span className="mr-1.5">{mood.emoji}</span>
                      <span>{mood.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Context select row */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-650 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand" /> 3. Who are you watching with?
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {contexts.map((context) => {
                  const active = selectedContext === context.id;
                  return (
                    <button
                      key={context.id}
                      onClick={() => setSelectedContext(context.id)}
                      className={`flex items-center px-4 py-2 border rounded-full text-xs font-bold transition-all duration-200 transform hover:scale-105
                        ${active
                          ? 'bg-brand border-brand text-white shadow-glow'
                          : 'dark:border-dark-border light:border-light-border dark:bg-dark-bg light:bg-slate-100 dark:text-dark-text light:text-light-text hover:border-slate-500'
                        }
                      `}
                    >
                      <span className="mr-1.5">{context.emoji}</span>
                      <span>{context.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit trigger button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleAskAI}
                disabled={loading}
                className="px-6 py-3 rounded-full bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-glow flex items-center transition-all duration-200"
              >
                <Send className="w-3.5 h-3.5 mr-2" />
                {loading ? 'AI scanning database...' : 'Scan Mood recommendations'}
              </button>
            </div>

          </div>

          {/* Typing AI chat message panel */}
          <AnimatePresence>
            {typingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-2xl dark:bg-emerald-950/20 light:bg-emerald-500/10 dark:border-emerald-500/20 light:border-emerald-500/30 text-xs text-emerald-500 leading-relaxed max-w-3xl"
              >
                {typingMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live recommendations grid display */}
          <div className="space-y-4 pt-4 border-t dark:border-dark-border/40 light:border-light-border/40">
            {loading ? (
              <MovieGridSkeleton count={8} />
            ) : movies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    inWatchlist={watchlistIds.includes(movie.id)}
                    onWatchlistToggle={handleWatchlistToggle}
                  />
                ))}
              </div>
            ) : (
              !typingMessage && (
                <EmptyState
                  icon="🧠"
                  title="Ready for Vibe Selection"
                  description="Choose your language, mood, and context checkboxes above to run AI recommendation algorithms."
                  ctaText="Ask AI Assistant"
                  onCtaClick={handleAskAI}
                />
              )
            )}
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

    </div>
  );
};

export default AISuggesterPage;
