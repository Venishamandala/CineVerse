import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Star, Film, Sparkles } from 'lucide-react';
import api from '../services/api';

const OnboardingPage = () => {
  const { savePreferences, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState(['en']);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [ratedMovies, setRatedMovies] = useState({}); // key: movieId, value: rating
  const [onboardingMovies, setOnboardingMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  // Mapped genres list with TMDB IDs
  const genresList = [
    { id: 28, name: 'Action', emoji: '💥' },
    { id: 12, name: 'Adventure', emoji: '🗺️' },
    { id: 16, name: 'Animation', emoji: '🧸' },
    { id: 35, name: 'Comedy', emoji: '😂' },
    { id: 80, name: 'Crime', emoji: '🕵️' },
    { id: 99, name: 'Documentary', emoji: '📹' },
    { id: 18, name: 'Drama', emoji: '🎭' },
    { id: 14, name: 'Fantasy', emoji: '🦄' },
    { id: 27, name: 'Horror', emoji: '👻' },
    { id: 9648, name: 'Mystery', emoji: '🔍' },
    { id: 10749, name: 'Romance', emoji: '💖' },
    { id: 878, name: 'Science Fiction', emoji: '🚀' },
    { id: 53, name: 'Thriller', emoji: '🔪' }
  ];

  // Languages supported
  const languagesList = [
    { code: 'en', name: 'English', detail: 'Hollywood & Indies' },
    { code: 'hi', name: 'Hindi', detail: 'Bollywood' },
    { code: 'te', name: 'Telugu', detail: 'Tollywood' },
    { code: 'ta', name: 'Tamil', detail: 'Kollywood' },
    { code: 'ml', name: 'Malayalam', detail: 'Mollywood' },
    { code: 'kn', name: 'Kannada', detail: 'Sandalwood' },
    { code: 'ko', name: 'Korean', detail: 'K-Dramas & Thrillers' },
    { code: 'ja', name: 'Japanese', detail: 'Anime & Cinema' },
    { code: 'es', name: 'Spanish', detail: 'Latin & European' },
    { code: 'fr', name: 'French', detail: 'Art-house & Classic' }
  ];

  // Fetch some popular movies for initial rating selection
  useEffect(() => {
    const fetchOnboardingMovies = async () => {
      setLoadingMovies(true);
      try {
        const res = await api.get('/movies/popular');
        if (res.data.success) {
          // Take first 6 popular movies to rate
          setOnboardingMovies(res.data.data.results.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load popular movies for onboarding:', err.message);
      } finally {
        setLoadingMovies(false);
      }
    };
    fetchOnboardingMovies();
  }, []);

  const handleLanguageToggle = (code) => {
    setSelectedLanguages(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleGenreToggle = (id) => {
    setSelectedGenres(prev =>
      prev.includes(id)
        ? prev.filter(gid => gid !== id)
        : [...prev, id]
    );
  };

  const handleRatingChange = async (movieId, movieTitle, posterPath, ratingValue) => {
    setRatedMovies(prev => ({
      ...prev,
      [movieId]: ratingValue
    }));

    // Post individual ratings to database immediately so history persists
    try {
      await api.post('/ratings', {
        movieId,
        movieTitle,
        posterPath,
        rating: ratingValue
      });
    } catch (err) {
      console.error(`Rating save error for movie ${movieId}:`, err.message);
    }
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    try {
      // 1. Submit language and genre preferences
      await savePreferences(selectedLanguages, selectedGenres);
      // 2. Set onboarding complete step
      setStep(4);
    } catch (err) {
      console.error('Failed to save onboarding preferences:', err.message);
    }
  };

  // Step 4 final redirect
  const handleRedirect = () => {
    navigate('/dashboard');
  };

  // Step Animations variants
  const slideVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] dark:bg-dark-bg light:bg-light-bg px-4 py-8">
      <div className="w-full max-w-3xl p-6 md:p-10 border rounded-3xl shadow-premium glass-panel dark:border-dark-border light:border-light-border dark:bg-dark-surface/60 light:bg-white transition-colors duration-300">
        
        {/* Progress header bars */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-bold text-brand uppercase tracking-widest">
              Step {step} of 3
            </span>
            <div className="flex space-x-2 w-32">
              <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-brand' : 'bg-slate-800'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-brand' : 'bg-slate-800'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-brand' : 'bg-slate-800'}`} />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black dark:text-dark-text light:text-light-text flex items-center">
                  🌐 What languages do you watch?
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  We'll prioritize movies released in your selected languages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {languagesList.map((lang) => {
                  const selected = selectedLanguages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageToggle(lang.code)}
                      className={`flex items-center justify-between p-4 border rounded-2xl text-left transition-all duration-300 group
                        ${selected
                          ? 'border-brand bg-brand/5 shadow-glow'
                          : 'dark:border-dark-border light:border-light-border dark:bg-dark-surface light:bg-light-surface hover:border-slate-500'
                        }
                      `}
                    >
                      <div>
                        <p className="font-bold text-sm dark:text-dark-text light:text-light-text">{lang.name}</p>
                        <p className="text-xs text-gray-400 group-hover:text-gray-300">{lang.detail}</p>
                      </div>
                      <div className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all
                        ${selected ? 'bg-brand border-brand text-white' : 'border-gray-500 text-transparent'}
                      `}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNext}
                  disabled={selectedLanguages.length === 0}
                  className="flex items-center px-6 py-2.5 text-sm font-bold text-white rounded-full bg-brand hover:bg-brand-hover shadow-glow disabled:opacity-50"
                >
                  Next step <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black dark:text-dark-text light:text-light-text">
                  🎭 Select your favorite genres
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Choose at least 2 genres to fine-tune your matching algorithms.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {genresList.map((genre) => {
                  const selected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreToggle(genre.id)}
                      className={`flex flex-col items-center justify-center p-5 border rounded-2xl transition-all duration-300 relative
                        ${selected
                          ? 'border-brand bg-brand/5 shadow-glow'
                          : 'dark:border-dark-border light:border-light-border dark:bg-dark-surface light:bg-light-surface hover:border-slate-500'
                        }
                      `}
                    >
                      <span className="text-3xl mb-2.5 filter drop-shadow">{genre.emoji}</span>
                      <span className="font-bold text-xs dark:text-dark-text light:text-light-text">{genre.name}</span>
                      
                      {selected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="flex items-center px-5 py-2.5 text-sm font-semibold rounded-full border dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text hover:bg-slate-500/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedGenres.length < 2}
                  className="flex items-center px-6 py-2.5 text-sm font-bold text-white rounded-full bg-brand hover:bg-brand-hover shadow-glow disabled:opacity-50"
                >
                  Next step <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black dark:text-dark-text light:text-light-text">
                  ⭐ Rate some popular movies
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Tell us what you've seen. This helps kickstart your personalized feeds immediately.
                </p>
              </div>

              {loadingMovies ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {onboardingMovies.map((movie) => {
                    const posterUrl = movie.poster_path
                      ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=200&auto=format&fit=crop';
                    const activeRating = ratedMovies[movie.id] || 0;

                    return (
                      <div
                        key={movie.id}
                        className="flex flex-col items-center p-3 border rounded-2xl dark:border-dark-border light:border-light-border dark:bg-dark-surface light:bg-light-surface"
                      >
                        <div className="aspect-[2/3] w-20 md:w-24 rounded-lg overflow-hidden mb-2.5 shadow-md">
                          <img src={posterUrl} alt={movie.title} className="object-cover w-full h-full" />
                        </div>
                        <p className="text-xs font-bold text-center line-clamp-1 w-full dark:text-dark-text light:text-light-text mb-2">
                          {movie.title}
                        </p>
                        
                        {/* 5-star rating deck */}
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRatingChange(movie.id, movie.title, movie.poster_path, star)}
                              className="focus:outline-none transform hover:scale-115 transition-transform"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  star <= activeRating ? 'text-amber-400 fill-current' : 'text-gray-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="flex items-center px-5 py-2.5 text-sm font-semibold rounded-full border dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text hover:bg-slate-500/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                  onClick={handleFinish}
                  className="flex items-center px-6 py-2.5 text-sm font-bold text-white rounded-full bg-brand hover:bg-brand-hover shadow-glow"
                >
                  Complete Setup <Sparkles className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center py-10 space-y-6"
            >
              <div className="text-7xl animate-bounce">✨</div>
              <h2 className="text-3xl font-black tracking-tight dark:text-dark-text light:text-light-text">
                Your movie universe is ready!
              </h2>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                Welcome to CineVerse, {user?.name}. We have customized your recommendation engines, favorite languages, and genre matches. Prepare for launch.
              </p>
              
              <button
                onClick={handleRedirect}
                className="px-8 py-3 text-sm font-bold text-white rounded-full bg-brand hover:bg-brand-hover shadow-glow flex items-center transition-all duration-300"
              >
                Enter CineVerse <Film className="w-4 h-4 ml-2" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
