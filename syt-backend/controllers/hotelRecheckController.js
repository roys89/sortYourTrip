// controllers/hotelRecheckController.js
const Itinerary = require("../models/Itinerary");
const HotelRecheckService = require("../services/hotelServices/hotelRecheckService");
const HotelAuthService = require("../services/hotelServices/hotelAuthService");
const HotelTokenManager = require('../services/tokenManagers/hotelTokenManager');

exports.recheckHotelPrices = async (req, res) => {
  try {
    const { itineraryToken } = req.params;
    const inquiryToken = req.headers["x-inquiry-token"];

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

    // Extract hotel queries from itinerary
    const hotelQueries = [];
    itinerary.cities.forEach(city => {
      city.days.forEach(day => {
        if (day.hotels) {
          day.hotels.forEach(hotel => {
            if (hotel.data) {
              hotelQueries.push({
                itineraryCode: hotel.data.itineraryCode,
                traceId: hotel.data.traceId,
                originalPrice: hotel.data.rate?.finalRate || 0
              });
            }
          });
        }
      });
    });

    if (hotelQueries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hotels found in itinerary",
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
      authToken,
      inquiryToken
    );

    // Calculate price difference
    const priceChangeData = {
      previousTotalPrice: hotelQueries.reduce((sum, query) => sum + query.originalPrice, 0),
      newTotalPrice: hotelPrices.total,
      priceChanged: Math.abs(hotelPrices.total - hotelQueries.reduce((sum, query) => sum + query.originalPrice, 0)) > 0,
      difference: hotelPrices.total - hotelQueries.reduce((sum, query) => sum + query.originalPrice, 0),
      percentageChange: ((hotelPrices.total - hotelQueries.reduce((sum, query) => sum + query.originalPrice, 0)) / hotelQueries.reduce((sum, query) => sum + query.originalPrice, 0)) * 100
    };

    // Respond with the price check results
    res.json({
      success: true,
      data: {
        ...hotelPrices,
        priceChangeData
      }
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
