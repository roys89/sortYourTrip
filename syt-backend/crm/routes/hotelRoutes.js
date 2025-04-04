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
const { protect, checkPermission } = require('../middleware/auth');

// Hotel search and booking routes with provider support
router.get('/:provider?/locations/search', protect, checkPermission('bookings'), searchLocation);
router.post('/:provider?/search', protect, checkPermission('bookings'), searchHotels);
router.post('/:provider?/itinerary', protect, checkPermission('bookings'), createItinerary);
router.post('/:provider?/room-rates', protect, checkPermission('bookings'), selectRoomRates);
router.post('/:provider?/allocate-guests', protect, checkPermission('bookings'), allocateGuests);
router.get('/:provider?/recheck-price', protect, checkPermission('bookings'), recheckPrice);
router.post('/:provider?/book', protect, checkPermission('bookings'), bookHotel);
router.get('/:provider?/booking-details/:bookingCode', protect, checkPermission('bookings'), getBookingDetails);

// Keep backward compatibility with old routes
router.get('/locations/search', protect, checkPermission('bookings'), searchLocation);
router.post('/search', protect, checkPermission('bookings'), searchHotels);
router.post('/itinerary', protect, checkPermission('bookings'), createItinerary);
router.post('/room-rates', protect, checkPermission('bookings'), selectRoomRates);
router.post('/allocate-guests', protect, checkPermission('bookings'), allocateGuests);
router.get('/recheck-price', protect, checkPermission('bookings'), recheckPrice);
router.post('/book', protect, checkPermission('bookings'), bookHotel);
router.get('/booking-details/:bookingCode', protect, checkPermission('bookings'), getBookingDetails);

module.exports = router; 