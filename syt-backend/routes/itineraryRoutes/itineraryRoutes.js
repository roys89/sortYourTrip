const express = require("express");
const router = express.Router();

// Import controllers
const {
  getTransferOptions,
  updateTransfersForChange,
} = require("../../controllers/transferController/transferChangeController");

const {
  createItinerary,
  getItinerary,
  getItineraryByInquiryToken,
  updateItineraryPrices,
  deleteItinerary
} = require("../../controllers/itineraryController/itineraryController");

const {
  replaceHotel,
  replaceActivity,
  removeActivity,
  updateActivityWithBookingRef,
  replaceRoom,
  replaceFlight,
  updateFlightSeatsAndBaggage,
  updateBookingStatus
} = require("../../controllers/itineraryController/itineraryModificationController"); 

const {
  searchAvailableHotels,
  getHotelDetails,
  selectHotelRoom,
  getHotelRooms,
  getItineraryDetails
} = require("../../controllers/hotelController/hotelChangeController");

const {
  searchAvailableFlights,
  getFareRules,
  selectFlight,
  getFlightItineraryDetails
} = require("../../controllers/flightController/flightChangeController");

const {
  getActivityDetails,
  getAvailableActivities,
  createActivityBookingReference,
} = require("../../controllers/activityController/activityControllerGRNC");


const {
  // recheckActivityPrices,
  recheckHotelPrices,
  recheckFlightPrices,
} = require("../../controllers/priceRecheckController");



const {getFlights} = require("../../controllers/flightController/flightControllerTC");


// Middleware
const checkAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  next();
};

const checkInquiryToken = (req, res, next) => {
  const inquiryToken = req.headers["x-inquiry-token"];
  if (!inquiryToken) {
    return res.status(401).json({ error: "Missing inquiry token" });
  }
  next();
};

// Initial Itinerary Routes
router.get("/inquiry/:inquiryToken", checkAuth, getItineraryByInquiryToken);
router.post("/:inquiryToken", checkAuth, createItinerary);
router.get("/:itineraryToken", checkAuth, checkInquiryToken, getItinerary);
router.put("/:itineraryToken/prices", checkAuth, updateItineraryPrices);
router.delete("/:inquiryToken", checkAuth, deleteItinerary);

// Itinerary Modification Routes
router.put("/:itineraryToken/activity", checkAuth, checkInquiryToken, replaceActivity);
router.delete("/:itineraryToken/activity", checkAuth, checkInquiryToken, removeActivity);
router.put("/:itineraryToken/hotel", checkAuth, checkInquiryToken, replaceHotel);
router.put(
  "/:itineraryToken/activity/booking-ref",
  checkAuth,
  checkInquiryToken,
  updateActivityWithBookingRef
);
router.put("/:itineraryToken/room", checkAuth, checkInquiryToken, replaceRoom);
router.put("/:itineraryToken/flight", checkAuth, checkInquiryToken, replaceFlight);
router.put(
  "/:itineraryToken/flight/seats",
  checkAuth,
  checkInquiryToken,
  updateFlightSeatsAndBaggage
);

// Flight Change Routes
router.post(
  "/flights/:inquiryToken",
  checkInquiryToken,
  searchAvailableFlights
);

router.get(
  "/flights/:inquiryToken/fare-rules",
  checkAuth,
  checkInquiryToken,
  getFareRules
);

router.post(
  "/flights/:inquiryToken/:resultIndex/select",
  checkAuth,
  checkInquiryToken,
  selectFlight
);

router.post(
  "/:itineraryToken/flight-details", 
  checkAuth, 
  checkInquiryToken, 
  getFlightItineraryDetails
);


// Hotel Change Routes
router.get(
  "/hotels/:inquiryToken/:cityName/:checkIn/:checkOut",
  checkInquiryToken,
  searchAvailableHotels
);

router.get(
  "/hotels/:inquiryToken/:hotelId/details",
  checkAuth,
  checkInquiryToken,
  getHotelDetails
);

router.get(
  "/hotels/:inquiryToken/:hotelId/rooms",
  checkAuth,
  checkInquiryToken,
  getHotelRooms
);

router.post(
  "/hotels/:inquiryToken/:hotelId/select-room",
  checkAuth,
  checkInquiryToken,
  selectHotelRoom
);

router.post(
  "/:itineraryToken/hotel-details",
  checkAuth,
  checkInquiryToken,
  getItineraryDetails
);

// Activity Routes
router.get(
  "/activities/:inquiryToken/:cityName/:date", 
  checkAuth,
  checkInquiryToken,
  getAvailableActivities
);

router.post(
  "/product-info/:activityCode",
  checkAuth,
  checkInquiryToken,
  getActivityDetails
);

router.post(
  "/activity/reference",
  checkAuth,
  checkInquiryToken,
  createActivityBookingReference
);

// Transfer Routes
router.post(
  "/:itineraryToken/transfers/update",
  checkAuth,
  checkInquiryToken,
  updateTransfersForChange
);

router.get(
  "/:itineraryToken/transfers/options",
  checkAuth,
  checkInquiryToken,
  getTransferOptions
);


// Recheck Routes

router.post(
  "/:itineraryToken/recheck-flights",
  checkAuth,
  checkInquiryToken,
  recheckFlightPrices
);

router.post(
  "/:itineraryToken/flights/search",
  checkAuth,
  checkInquiryToken,
  getFlights
);

router.post('/:itineraryToken/recheck-hotels', checkAuth,
  checkInquiryToken,
  recheckHotelPrices);

  router.put(
    "/:itineraryToken/booking-status",
    checkAuth,
    checkInquiryToken,
    updateBookingStatus
  );

module.exports = router;