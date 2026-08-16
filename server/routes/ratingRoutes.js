const express = require('express');
const router = express.Router();
const { upsertRating, getMovieRating, getUserRatings, deleteRating } = require('../controllers/ratingController');
const { validateRating } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all rating routes

router.route('/')
  .post(validateRating, upsertRating)
  .get(getUserRatings);

router.route('/:movieId')
  .get(getMovieRating)
  .delete(deleteRating);

module.exports = router;
