// Lightweight input validation middleware

const validateRegister = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.'
    });
  }

  // Simple email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  // Password length validation
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  // Confirm password check
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match.'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email and password.'
    });
  }

  next();
};

const validateRating = (req, res, next) => {
  const { movieId, movieTitle, rating } = req.body;

  if (!movieId || !movieTitle || rating === undefined) {
    return res.status(400).json({
      success: false,
      message: 'movieId, movieTitle, and rating are required.'
    });
  }

  const ratingVal = Number(rating);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be an integer between 1 and 5 stars.'
    });
  }

  next();
};

const validateWatchlist = (req, res, next) => {
  const { movieId, movieTitle } = req.body;

  if (!movieId || !movieTitle) {
    return res.status(400).json({
      success: false,
      message: 'movieId and movieTitle are required.'
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateRating,
  validateWatchlist
};
