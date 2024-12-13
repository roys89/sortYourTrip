const express = require('express');
const { 
  createItinerary, 
  getItinerary,
  getItineraryByInquiryToken,
  updateItineraryPrices
} = require('../../controllers/itineraryController/itineraryController');

const {
  getActivityDetails,
  getAvailableActivities
} = require('../../controllers/itineraryController/activityController');

const {
  getAvailableHotels,
  recheckHotelRate
} = require('../../controllers/itineraryController/hotelController');

const {
  replaceHotel,
  replaceActivity,
  removeActivity
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

// Activity routes
router.get('/activities/:inquiryToken/:cityName/:date', getAvailableActivities);
router.post('/product-info/:activityCode', checkInquiryToken, getActivityDetails);

// Hotel routes
router.get('/hotels/:inquiryToken/:cityName/:date', checkInquiryToken, getAvailableHotels);
router.post('/hotel-recheck/:hotelCode', checkInquiryToken, recheckHotelRate);

module.exports = router;