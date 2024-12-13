const express = require("express");
const { createItineraryInquiry, getItineraryInquiryByToken } = require("../controllers/itineraryInquiryController");
const router = express.Router();

// POST request to create a new itinerary inquiry
router.post("/", express.json(), createItineraryInquiry); // Use body-parser for POST requests

// GET request to retrieve itinerary inquiry by token
router.get("/:token", getItineraryInquiryByToken); // No need for body-parser for GET

module.exports = router;
