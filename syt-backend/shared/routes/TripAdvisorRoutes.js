// routes/TripAdvisorRoutes.js
const express = require('express');
const { body } = require('express-validator');
const TripAdvisorController = require('../controllers/TripAdvisorController/TripAdvisorController');

const router = express.Router();

// Validation middleware
const validateLocationRequest = [
  body('name').notEmpty().withMessage('Name is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('country').notEmpty().withMessage('Country is required')
];

// Routes
/**
 * @route POST /api/tripadvisor/activity/rating
 * @desc Get TripAdvisor rating for an activity
 * @access Private
 */
router.post(
  '/activity/rating',
  validateLocationRequest,
  TripAdvisorController.getActivityRating.bind(TripAdvisorController)
);

/**
 * @route POST /api/tripadvisor/hotel/rating
 * @desc Get TripAdvisor rating for a hotel
 * @access Private
 */
router.post(
  '/hotel/rating',
  validateLocationRequest,
  TripAdvisorController.getHotelRating.bind(TripAdvisorController)
);

module.exports = router;