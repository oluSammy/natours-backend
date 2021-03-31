const express = require('express');
const tourController = require('../controllers/tourController.js');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} = tourController;

const { protectRoute, restrictTo } = authController;

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

// router.param('id', checkId);

router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    protectRoute,
    restrictTo('admin', 'lead-guide', 'guide'),
    getMonthlyPlan
  );
router
  .route('/')
  .get(getAllTours)
  .post(protectRoute, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/:id')
  .get(getTour)
  .patch(
    protectRoute,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protectRoute, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
