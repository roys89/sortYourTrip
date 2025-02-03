// controllers/priceRecheckController.js
const Itinerary = require("../models/Itinerary");
const FlightRecheckService = require("../services/flightServices/flightRecheckService");
const FlightAuthService = require("../services/flightServices/flightAuthService");
const FlightTokenManager = require('../services/tokenManagers/flightTokenManager');
const HotelRecheckService = require("../services/hotelServices/hotelRecheckService");
const HotelAuthService = require("../services/hotelServices/hotelAuthService");
const HotelTokenManager = require('../services/tokenManagers/hotelTokenManager');


exports.recheckFlightPrices = async (req, res) => {
  try {
    const { itineraryToken } = req.params;
    const { flightQueries } = req.body;  // Array of { itineraryCode, traceId }
    const inquiryToken = req.headers["x-inquiry-token"];

    // Validate request
    if (!flightQueries || !Array.isArray(flightQueries)) {
      return res.status(400).json({
        success: false,
        message: "Invalid flight queries",
      });
    }

    // Find the itinerary
    const itinerary = await Itinerary.findOne({
      itineraryToken,
      inquiryToken,
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found",
      });
    }

    // Get auth token using the token manager
    const authToken = await FlightTokenManager.getOrSetToken(
      async () => {
        const authResponse = await FlightAuthService.login();
        return authResponse.token;
      }
    );

    if (!authToken) {
      throw new Error("Failed to get authentication token");
    }

    // Call the service with auth token
    const flightPrices = await FlightRecheckService.recheckFlights(
      flightQueries,
      authToken
    );

    // Respond with the price check results
    res.json({
      success: true,
      data: flightPrices
    });

  } catch (error) {
    console.error("Error checking flight prices:", error);
    
    // Handle specific error types
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: "Failed to authenticate with flight service"
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later"
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to check flight prices"
    });
  }
};


exports.recheckHotelPrices = async (req, res) => {
  try {
    const { itineraryToken } = req.params;
    const { hotelQueries } = req.body;  // Array of { itineraryCode, traceId }
    const inquiryToken = req.headers["x-inquiry-token"];

    // Validate request
    if (!hotelQueries || !Array.isArray(hotelQueries)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel queries",
      });
    }

    // Find the itinerary
    const itinerary = await Itinerary.findOne({
      itineraryToken,
      inquiryToken,
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found",
      });
    }

    // Get auth token using the token manager
    const authToken = await HotelTokenManager.getOrSetToken(
      async () => {
        const authResponse = await HotelAuthService.login();
        return authResponse.token;
      }
    );

    if (!authToken) {
      throw new Error("Failed to get authentication token");
    }

    // Call the service with auth token
    const hotelPrices = await HotelRecheckService.recheckHotels(
      hotelQueries,
      authToken
    );

    // Respond with the price check results
    res.json({
      success: true,
      data: hotelPrices
    });

  } catch (error) {
    console.error("Error checking hotel prices:", error);
    
    // Handle specific error types
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: "Failed to authenticate with hotel service"
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later"
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to check hotel prices"
    });
  }
};