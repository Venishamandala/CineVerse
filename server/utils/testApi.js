require('dotenv').config();
const mongoose = require('mongoose');
const tmdbService = require('../services/tmdbService');
const { generateRecommendationsForUser } = require('../services/recommendationService');
const User = require('../models/User');
const UserPreference = require('../models/UserPreference');

const runDiagnostics = async () => {
  console.log('🧪 Starting CineVerse API and Database Diagnostics...');
  let hasErrors = false;

  // 1. Database Connection check
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cineverse';
    console.log(`🔗 Attempting to connect to MongoDB: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`); // Hide passwords if any
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connection: SUCCESSFUL');
  } catch (err) {
    console.error('❌ MongoDB Connection: FAILED');
    console.error(err.message);
    hasErrors = true;
  }

  // 2. TMDB API request check
  try {
    console.log('🎬 Fetching popular movies from TMDB Service...');
    const popular = await tmdbService.getPopularMovies();
    if (popular && popular.results && popular.results.length > 0) {
      console.log(`✅ TMDB API Connection: SUCCESSFUL (${popular.results.length} movies retrieved)`);
      console.log(`   Sample Movie: "${popular.results[0].title}"`);
    } else {
      console.warn('⚠️ TMDB API Warning: Retreived empty list.');
    }
  } catch (err) {
    console.error('❌ TMDB API Service: FAILED');
    console.error(err.message);
    hasErrors = true;
  }

  // 3. Recommendation engine simulation
  try {
    console.log('🧠 Simulating recommendation engine calculation...');
    // Create a dummy user inside mongo to run scoring
    let dummyUser = await User.findOne({ email: 'test_diagnostics@cineverse.com' });
    if (!dummyUser) {
      dummyUser = await User.create({
        name: 'Diagnostics Robot',
        email: 'test_diagnostics@cineverse.com',
        passwordHash: 'dummy_hash_192847',
        preferredLanguages: ['en', 'ja'],
        favoriteGenres: [28, 878] // Action, Sci-Fi
      });
      await UserPreference.create({
        userId: dummyUser._id,
        preferredLanguages: ['en', 'ja'],
        favoriteGenres: [28, 878]
      });
    }

    const recs = await generateRecommendationsForUser(dummyUser._id);
    console.log(`✅ Recommendation engine: SUCCESSFUL (Generated ${recs.length} personalized recommendations)`);
    if (recs.length > 0) {
      console.log(`   Top recommendation: "${recs[0].title}" with Score: ${recs[0].score}%`);
      console.log(`   Reason: "${recs[0].reason}"`);
    }

    // Cleanup dummy user
    await User.findByIdAndDelete(dummyUser._id);
    await UserPreference.findOneAndDelete({ userId: dummyUser._id });
    console.log('🧹 Cleaned up temporary test diagnostics documents.');

  } catch (err) {
    console.error('❌ Recommendation Engine Simulation: FAILED');
    console.error(err.message);
    hasErrors = true;
  }

  // Final summary
  console.log('\n======================================');
  if (hasErrors) {
    console.error('❌ Diagnostics completed with CRITICAL ERRORS. Please check config.');
    process.exit(1);
  } else {
    console.log('✨ All diagnostics PASSED! CineVerse is fully operational.');
    process.exit(0);
  }
};

runDiagnostics();
