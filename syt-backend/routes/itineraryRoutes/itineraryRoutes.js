const express = require('express');
const { 
  createItinerary, 
  getItinerary,
  getItineraryByInquiryToken,
  updateItineraryPrices
} = require('../../controllers/itineraryController/itineraryController');

const {
  getActivityDetails,
  getAvailableActivities,
  createActivityBookingReference
} = require('../../controllers/itineraryController/activityControllerGRNC');

const {
  getAvailableHotels,
  recheckHotelRate
} = require('../../controllers/itineraryController/hotelControllerGRNC');

const {
  replaceHotel,
  replaceActivity,
  removeActivity,
  updateActivityWithBookingRef,  // Add these imports
} = require('../../controllers/itineraryController/itineraryModificationController');
const router = express.Router();

// Middleware to check inquiry token where needed
const checkInquiryToken = (req, res, next) => {
  const inquiryToken = req.headers['x-inquiry-token'];
  if (!inquiryToken) {
    return res.status(401).json({ error: 'Missing inquiry token' });
  }
  next();
}; 

// Itinerary routes
router.get('/inquiry/:inquiryToken', getItineraryByInquiryToken);
router.post('/:inquiryToken', createItinerary);
router.get('/:itineraryToken', checkInquiryToken, getItinerary);
router.put('/:itineraryToken/prices', updateItineraryPrices);

// Itinerary modification routes
router.put('/:itineraryToken/activity', checkInquiryToken, replaceActivity);
router.delete('/:itineraryToken/activity', checkInquiryToken, removeActivity);
router.put('/:itineraryToken/hotel', checkInquiryToken, replaceHotel);
router.put('/:itineraryToken/activity/booking-ref', 
  checkInquiryToken, 
  updateActivityWithBookingRef     // Use the imported function
);

// Activity routes
router.get('/activities/:inquiryToken/:cityName/:date', getAvailableActivities);
router.post('/product-info/:activityCode', checkInquiryToken, getActivityDetails);
router.post('/activity/reference', checkInquiryToken, createActivityBookingReference);

// Hotel routes
router.get('/hotels/:inquiryToken/:cityName/:date', checkInquiryToken, getAvailableHotels);
router.post('/hotel-recheck/:hotelCode', checkInquiryToken, recheckHotelRate);

module.exports = router;