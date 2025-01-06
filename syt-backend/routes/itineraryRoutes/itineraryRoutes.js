// routes/api/itineraryRoutes.js
const express = require('express');
const router = express.Router();

// Import controllers 
const { 
  createItinerary, 
  getItinerary,
  getItineraryByInquiryToken,
  updateItineraryPrices
} = require('../../controllers/itineraryController/itineraryController');

const {
  replaceHotel,
  replaceActivity,
  removeActivity,
  updateActivityWithBookingRef,
} = require('../../controllers/itineraryController/itineraryModificationController');

const {
  searchAvailableHotels,
  getHotelDetails,
  selectHotelRoom
} = require('../../controllers/itineraryController/hotelChangeController');

const {
  getActivityDetails,
  getAvailableActivities,
  createActivityBookingReference
} = require('../../controllers/itineraryController/activityControllerGRNC');

// Middleware
const checkInquiryToken = (req, res, next) => {
  const inquiryToken = req.headers['x-inquiry-token'];
  if (!inquiryToken) {
    return res.status(401).json({ error: 'Missing inquiry token' });
  }
  next();
}; 

// Initial Itinerary Routes
router.get('/inquiry/:inquiryToken', getItineraryByInquiryToken);
router.post('/:inquiryToken', createItinerary);
router.get('/:itineraryToken', checkInquiryToken, getItinerary);
router.put('/:itineraryToken/prices', updateItineraryPrices);

// Itinerary Modification Routes
router.put('/:itineraryToken/activity', checkInquiryToken, replaceActivity);
router.delete('/:itineraryToken/activity', checkInquiryToken, removeActivity);
router.put('/:itineraryToken/hotel', checkInquiryToken, replaceHotel);
router.put('/:itineraryToken/activity/booking-ref', checkInquiryToken, updateActivityWithBookingRef);

// New Hotel Change Routes
router.get('/hotels/:inquiryToken/:cityName/:checkIn/:checkOut', checkInquiryToken, searchAvailableHotels);
router.get('/hotels/:inquiryToken/:hotelId/details', checkInquiryToken, getHotelDetails);
router.post('/hotels/:inquiryToken/:hotelId/select-room', checkInquiryToken, selectHotelRoom);

// Activity Routes
router.get('/activities/:inquiryToken/:cityName/:date', getAvailableActivities);
router.post('/product-info/:activityCode', checkInquiryToken, getActivityDetails);
router.post('/activity/reference', checkInquiryToken, createActivityBookingReference);

module.exports = router;