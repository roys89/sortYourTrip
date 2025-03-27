const HotelTokenManager = require("../../shared/services/tokenManagersTC/hotelTokenManager");
const HotelAuthService = require("../../shared/services/hotelServicesTC/hotelAuthService");
const HotelLocationService = require("../../shared/services/hotelServicesTC/hotelLocationService");
const HotelSearchService = require("../../shared/services/hotelServicesTC/hotelSearchService");
const HotelItineraryService = require("../../shared/services/hotelServicesTC/hotelItineraryService");
const HotelRoomRatesService = require('../../shared/services/hotelServicesTC/hotelRoomRatesService');
const HotelRoomService = require('../../shared/services/hotelServicesTC/hotelRoomService');
const HotelRecheckService = require('../../shared/services/hotelServicesTC/hotelRecheckService');
const HotelBookingService = require('../../shared/services/hotelServicesTC/hotelBookingService');
const HotelBookingDetailsService = require('../../shared/services/hotelServicesTC/hotelBookingDetailsService');
const logger = require('../../shared/utils/logger');
const { handleError } = require('../../shared/helpers/errorHandler');

module.exports = {
  searchLocation: async (req, res) => {
    const { searchString } = req.query;
    const inquiryToken = req.headers['x-inquiry-token'] || 'unknown';

    try {
      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Search location using HotelLocationService
      const locationResponse = await HotelLocationService.searchLocation(
        searchString,
        authToken,
        inquiryToken,
        new Date().toISOString()
      );

      logger.info(`Retrieved ${locationResponse.results?.length || 0} locations for search: ${searchString}`);

      res.json({
        success: true,
        data: locationResponse
      });

    } catch (error) {
      console.error("Error searching locations:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to search locations",
        details: error.details || {}
      });
    }
  },

  searchHotels: async (req, res) => {
    const searchParams = req.body;
    const inquiryToken = req.headers['x-inquiry-token'] || 'unknown';

    try {
      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Search hotels using HotelSearchService
      const searchResponse = await HotelSearchService.searchHotels(
        searchParams,
        authToken,
        inquiryToken
      );

      logger.info(`Retrieved hotel search results for location: ${searchParams.locationId}`);

      // Extract pagination info from response
      const hotels = searchResponse?.results?.[0]?.data || [];
      const totalCount = searchResponse?.results?.[0]?.totalCount || 0;
      const totalPages = searchResponse?.results?.[0]?.totalPages || 1;
      const currentPage = searchParams.page || 1;
      const traceId = searchResponse?.results?.[0]?.traceId;

      res.json({
        success: true,
        data: {
          results: [{
            data: hotels,
            totalCount,
            totalPages,
            currentPage,
            traceId
          }],
          traceId
        }
      });

    } catch (error) {
      console.error("Error searching hotels:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to search hotels",
        details: error.details || {}
      });
    }
  },

  createItinerary: async (req, res) => {
    const { hotelId, traceId, cityName, startDate } = req.body;
    const inquiryToken = req.headers['x-inquiry-token'] || 'unknown';

    try {
      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Create itinerary using HotelItineraryService
      const itineraryResponse = await HotelItineraryService.createItinerarySequential(
        {
          hotelId,
          traceId,
          cityName,
          startDate
        },
        authToken,
        inquiryToken
      );

      logger.info(`Created itinerary for hotel: ${hotelId}`);

      res.json({
        success: true,
        data: itineraryResponse
      });

    } catch (error) {
      console.error("Error creating itinerary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create itinerary",
        details: error.details || {}
      });
    }
  },

  selectRoomRates: async (req, res) => {
    try {
      const {
        roomsAndRateAllocations,
        traceId,
        recommendationId,
        items,
        itineraryCode,
        cityName,
        inquiryToken,
        date
      } = req.body;

      // Get auth token using HotelTokenManager
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Call the service to select room rates with the fresh token
      const response = await HotelRoomRatesService.selectRoomRates(
        {
          roomsAndRateAllocations,
          traceId,
          recommendationId,
          items,
          itineraryCode,
          cityName,
          inquiryToken,
          date
        },
        authToken
      );

      res.json(response);
    } catch (error) {
      logger.error('Error in selectRoomRates:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to select room rates',
        error: error.response?.data || {}
      });
    }
  },

  recheckPrice: async (req, res) => {
    try {
      const { itineraryCode, traceId } = req.query;
      const inquiryToken = req.headers['x-inquiry-token'] || 'unknown';

      if (!itineraryCode || !traceId) {
        return res.status(400).json({
          success: false,
          message: 'itineraryCode and traceId are required'
        });
      }

      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Call HotelRecheckService to verify price
      const hotelQueries = [{
        itineraryCode,
        traceId,
        inquiryToken
      }];

      const response = await HotelRecheckService.recheckHotels(hotelQueries, authToken);

      logger.info(`Price recheck completed for itinerary: ${itineraryCode}`);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logger.error('Error in recheckPrice:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to recheck price',
        error: error.response?.data || {}
      });
    }
  },

  allocateGuests: async (req, res) => {
    try {
      const { itineraryCode, bookingArray } = req.body;
      const inquiryToken = req.headers['x-inquiry-token'] || 'unknown';

      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Call HotelRoomService to allocate guests
      const response = await HotelRoomService.allocateRooms(
        itineraryCode,
        bookingArray,
        authToken
      );

      logger.info(`Allocated guests for itinerary: ${itineraryCode}`);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logger.error('Error in allocateGuests:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to allocate guests',
        error: error.response?.data || {}
      });
    }
  },

  bookHotel: async (req, res) => {
    try {
      const { traceId, itineraryCode } = req.body;
      const inquiryToken = req.headers['x-inquiry-token'] || 'unknown';

      if (!traceId || !itineraryCode) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: traceId and itineraryCode are required'
        });
      }

      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Call HotelBookingService to book the hotel
      const response = await HotelBookingService.bookHotel({
        traceId,
        code: itineraryCode,
        token: authToken,
        inquiryToken
      });

      logger.info(`Hotel booking completed for itinerary: ${itineraryCode}`);

      res.json(response);

    } catch (error) {
      logger.error('Error in bookHotel:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to book hotel',
        error: error.response?.data || {}
      });
    }
  },

  getBookingDetails: async (req, res) => {
    try {
      const { bookingCode } = req.params;
      const inquiryToken = req.headers['x-inquiry-token'] || 'unknown';
      const { date, city } = req.query;

      if (!bookingCode) {
        return res.status(400).json({
          success: false,
          message: 'Booking code is required'
        });
      }

      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Call HotelBookingDetailsService to get booking details
      const response = await HotelBookingDetailsService.getBookingDetails({
        bookingCode,
        token: authToken,
        inquiryToken,
        date,
        city
      });

      logger.info(`Retrieved booking details for booking code: ${bookingCode}`);

      res.json(response);

    } catch (error) {
      logger.error('Error in getBookingDetails:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to get booking details',
        error: error.response?.data || {}
      });
    }
  }
}; 