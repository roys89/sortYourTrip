// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// Get all activities with optional filters
router.get('/', activityController.getAllActivities);

// Get activity by activityCode
router.get('/:activityCode', activityController.getActivityByCode);

// Get activities by destination
router.get('/destination/:destinationCode', activityController.getActivitiesByDestination);

// Create new activity
router.post('/', activityController.createActivity);

// Update activity
router.put('/:activityCode', activityController.updateActivity);

// Delete activity
router.delete('/:activityCode', activityController.deleteActivity);

// Advanced search endpoints
router.get('/search/budget/:budget', activityController.getActivitiesByBudget);
router.get('/search/timeSlot/:timeSlot', activityController.getActivitiesByTimeSlot);
router.get('/search/category/:category', activityController.getActivitiesByCategory);
router.get('/search/duration/:minDuration/:maxDuration', activityController.getActivitiesByDuration);
router.get('/search/rating/:minRating', activityController.getActivitiesByRating);

module.exports = router;