const express = require("express");
const router = express.Router();

// Import controllers
const {
  getTransferOptions,
  updateTransfersForChange,
} = require("../../controllers/itineraryController/transferChangeController");

const {
  createItinerary,
  getItinerary,
  getItineraryByInquiryToken,
  updateItineraryPrices,
} = require("../../controllers/itineraryController/itineraryController");

const {
  replaceHotel,
  replaceActivity,
  removeActivity,
  updateActivityWithBookingRef,
  replaceRoom,
  replaceFlight
} = require("../../controllers/itineraryController/itineraryModificationController"); 

const {
  searchAvailableHotels,
  getHotelDetails,
  selectHotelRoom,
  getHotelRooms,
} = require("../../controllers/itineraryController/hotelChangeController");

// Import new flight controller
const {
  searchAvailableFlights,
  getFareRules,
  selectFlight
} = require("../../controllers/itineraryController/flightChangeController");

const {
  getActivityDetails,
  getAvailableActivities,
  createActivityBookingReference,
} = require("../../controllers/itineraryController/activityControllerGRNC");

// Middleware
const checkInquiryToken = (req, res, next) => {
  const inquiryToken = req.headers["x-inquiry-token"];
  if (!inquiryToken) {
    return res.status(401).json({ error: "Missing inquiry token" });
  }
  next();
};

// Initial Itinerary Routes
router.get("/inquiry/:inquiryToken", getItineraryByInquiryToken);
router.post("/:inquiryToken", createItinerary);
router.get("/:itineraryToken", checkInquiryToken, getItinerary);
router.put("/:itineraryToken/prices", updateItineraryPrices);

// Itinerary Modification Routes
router.put("/:itineraryToken/activity", checkInquiryToken, replaceActivity);
router.delete("/:itineraryToken/activity", checkInquiryToken, removeActivity);
router.put("/:itineraryToken/hotel", checkInquiryToken, replaceHotel);
router.put(
  "/:itineraryToken/activity/booking-ref",
  checkInquiryToken,
  updateActivityWithBookingRef
);
router.put("/:itineraryToken/room", checkInquiryToken, replaceRoom);
router.put("/:itineraryToken/flight", checkInquiryToken, replaceFlight);

// Flight Change Routes
router.post(
  "/flights/:inquiryToken",
  checkInquiryToken,
  searchAvailableFlights
);

router.get(
  "/flights/:inquiryToken/fare-rules",
  checkInquiryToken,
  getFareRules
);


router.post(
  "/flights/:inquiryToken/:resultIndex/select",
  checkInquiryToken,
  selectFlight
);

// Hotel Change Routes
router.get(
  "/hotels/:inquiryToken/:cityName/:checkIn/:checkOut",
  checkInquiryToken,
  searchAvailableHotels
);
router.get(
  "/hotels/:inquiryToken/:hotelId/details",
  checkInquiryToken,
  getHotelDetails
);
router.get(
  "/hotels/:inquiryToken/:hotelId/rooms",
  checkInquiryToken,
  getHotelRooms
);
router.post(
  "/hotels/:inquiryToken/:hotelId/select-room",
  checkInquiryToken,
  selectHotelRoom
);

// Activity Routes
router.get("/activities/:inquiryToken/:cityName/:date", getAvailableActivities);
router.post(
  "/product-info/:activityCode",
  checkInquiryToken,
  getActivityDetails
);
router.post(
  "/activity/reference",
  checkInquiryToken,
  createActivityBookingReference
);

// Transfer Routes
router.post(
  "/:itineraryToken/transfers/update",
  checkInquiryToken,
  updateTransfersForChange
);

router.get(
  "/:itineraryToken/transfers/options",
  checkInquiryToken,
  getTransferOptions
);

module.exports = router;
