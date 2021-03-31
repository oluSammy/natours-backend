const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

const { protectRoute, restrictTo } = authController;
const {
  createReview,
  getAllReviews,
  getReview,
  deleteReview,
  updateReview,
  setTourUserIds,
} = reviewController;

router
  .route('/')
  .post(protectRoute, restrictTo('user'), setTourUserIds, createReview)
  .get(getAllReviews);

router
  .route('/:id')
  .delete(protectRoute, restrictTo('user', 'admin'), deleteReview)
  .patch(protectRoute, restrictTo('user', 'admin'), updateReview)
  .get(getReview);

module.exports = router;
