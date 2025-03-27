const express = require('express');
const router = express.Router();
const { 
  searchLocation,
  searchHotels,
  createItinerary,
  selectRoomRates,
  allocateGuests,
  recheckPrice,
  bookHotel,
  getBookingDetails
} = require('../controllers/hotelController');
const { protect } = require('../middleware/auth');

// Hotel search and booking routes with provider support
router.get('/:provider?/locations/search', protect, searchLocation);
router.post('/:provider?/search', protect, searchHotels);
router.post('/:provider?/itinerary', protect, createItinerary);
router.post('/:provider?/room-rates', protect, selectRoomRates);
router.post('/:provider?/allocate-guests', protect, allocateGuests);
router.get('/:provider?/recheck-price', protect, recheckPrice);
router.post('/:provider?/book', protect, bookHotel);
router.get('/:provider?/booking-details/:bookingCode', protect, getBookingDetails);

// Keep backward compatibility with old routes
router.get('/locations/search', protect, searchLocation);
router.post('/search', protect, searchHotels);
router.post('/itinerary', protect, createItinerary);
router.post('/room-rates', protect, selectRoomRates);
router.post('/allocate-guests', protect, allocateGuests);
router.get('/recheck-price', protect, recheckPrice);
router.post('/book', protect, bookHotel);
router.get('/booking-details/:bookingCode', protect, getBookingDetails);

module.exports = router; 