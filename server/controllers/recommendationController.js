const { generateRecommendationsForUser } = require('../services/recommendationService');
const tmdbService = require('../services/tmdbService');

// @desc    Get user's personalized recommendations
// @route   GET /api/recommendations
// @access  Private
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recommendations = await generateRecommendationsForUser(userId);

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get situation and mood-based recommendations
// @route   GET /api/recommendations/mood
// @access  Private
const getMoodRecommendations = async (req, res, next) => {
  try {
    const { mood, context, language } = req.query;
    if (!mood || !context || !language) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mood, context, and language parameters are required.' 
      });
    }

    // Map moods to TMDB Genre IDs
    const moodGenreMap = {
      happy: [35, 10751, 16], // Comedy, Family, Animation
      melancholy: [18, 10749], // Drama, Romance
      thrill: [28, 53, 12, 27], // Action, Thriller, Adventure, Horror
      deep: [9648, 878, 99], // Mystery, Sci-Fi, Documentary
      relaxed: [35, 10749, 14] // Comedy, Romance, Fantasy
    };

    // Mapped configurations
    const genres = new Set(moodGenreMap[mood] || []);
    
    if (context === 'family') {
      // Force family-friendly animation/comedy/family genres
      genres.clear();
      [10751, 16, 35].forEach(g => genres.add(g));
    } else if (context === 'date') {
      // Add romance and light comedies
      [10749, 35].forEach(g => genres.add(g));
    }

    const genreString = Array.from(genres).join('|');

    // Choose sort criteria based on situation
    let sortBy = 'popularity.desc';
    if (context === 'alone') {
      sortBy = 'vote_average.desc'; // Solo viewers prefer high-rated, deep plots
    }

    const data = await tmdbService.discoverMovies({
      genreId: genreString,
      sortBy,
      language: language, // Pass original language code (en, hi, ko, ja, es, etc.)
      page: 1
    });

    const moodLabels = { 
      happy: 'cheerful & uplifting', 
      melancholy: 'deeply emotional & moving', 
      thrill: 'adrenaline-pumping & suspenseful', 
      deep: 'mind-bending & thought-provoking', 
      relaxed: 'laid-back & relaxing' 
    };

    const contextLabels = { 
      alone: 'some quality solo viewing time', 
      date: 'a cozy date night', 
      family: 'a fun family evening', 
      friends: 'a lively movie night with friends' 
    };

    const languageNames = {
      en: 'English',
      hi: 'Hindi',
      te: 'Telugu',
      ta: 'Tamil',
      ko: 'Korean',
      ja: 'Japanese',
      es: 'Spanish',
      fr: 'French'
    };

    const targetLang = languageNames[language] || 'selected language';

    const aiMessage = `🤖 CineVerse AI Assistant: I've scanned the movie directory to match your vibe! Since you're looking for a ${moodLabels[mood]} experience in **${targetLang}** suited for ${contextLabels[context]}, I have calculated these top matches. I filtered by specific genre groups and sorted by relevance to guarantee high viewing accuracy. Grab your popcorn! 🍿✨`;

    res.json({
      success: true,
      message: aiMessage,
      data: (data.results || []).slice(0, 8) // Limit to top 8 items for clean layout grid
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getMoodRecommendations
};
