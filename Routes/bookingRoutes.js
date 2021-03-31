const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  authController.protectRoute,
  bookingController.getCheckoutSession
);

router.use(authController.protectRoute);
router.use(authController.restrictTo('lead-guide', 'admin'));

router
  .route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

router
  .route('/id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
