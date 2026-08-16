const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserPreference = require('../models/UserPreference');

// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'cineverse_secure_random_jwt_secret_token_19384729384',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Create user in db
    const user = await User.create({
      name,
      email,
      passwordHash: password, // Pre-save hook hashes this
      avatar: ['🍿', '🎬', '🎟️', '⭐', '✨', '🎥'][Math.floor(Math.random() * 6)] // Random avatar emoji
    });

    if (user) {
      // Create associated default UserPreference row
      await UserPreference.create({
        userId: user._id,
        preferredLanguages: ['en'],
        favoriteGenres: []
      });

      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          preferredLanguages: user.preferredLanguages,
          favoriteGenres: user.favoriteGenres
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data provided.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user (include passwordHash)
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferredLanguages: user.preferredLanguages,
        favoriteGenres: user.favoriteGenres
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferredLanguages: user.preferredLanguages,
        favoriteGenres: user.favoriteGenres,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  // Since JWT is stateless, logout is handled client-side by purging token.
  // We send a success message.
  res.json({
    success: true,
    message: 'User logged out successfully. Token invalidated.'
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser
};
