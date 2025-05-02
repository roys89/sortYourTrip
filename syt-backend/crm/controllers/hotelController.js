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
const hotelCancelService = require('../../shared/services/hotelServicesTC/hotelCancelService');

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

      // --- Process Filters (similar to hotelChangeController) --- 
      let processedFilters = null;
      if (searchParams.filterBy) {
          processedFilters = { ...searchParams.filterBy }; // Start with a copy
          // Clean up common boolean/string/array fields
          if ('freeBreakfast' in processedFilters) processedFilters.freeBreakfast = Boolean(processedFilters.freeBreakfast);
          if ('isRefundable' in processedFilters) processedFilters.isRefundable = Boolean(processedFilters.isRefundable);
          if (processedFilters.reviewRatings && Array.isArray(processedFilters.reviewRatings)) {
              processedFilters.reviewRatings = processedFilters.reviewRatings.map(r => Number(r)).filter(r => !isNaN(r) && r >= 1 && r <= 5);
              if (processedFilters.reviewRatings.length === 0) delete processedFilters.reviewRatings;
          }
          if ('type' in processedFilters && typeof processedFilters.type === 'string' && processedFilters.type.trim() !== '') {
              processedFilters.type = processedFilters.type.trim();
          } else { delete processedFilters.type; }
          if ('tags' in processedFilters && Array.isArray(processedFilters.tags) && processedFilters.tags.length > 0) {
              processedFilters.tags = processedFilters.tags.map(tag => String(tag).trim()).filter(tag => tag);
              if (processedFilters.tags.length === 0) delete processedFilters.tags;
          } else { delete processedFilters.tags; }
          if (!processedFilters.hotelName || processedFilters.hotelName.trim() === '') {
              delete processedFilters.hotelName;
          }
          if (processedFilters.ratings && Array.isArray(processedFilters.ratings)) {
              processedFilters.ratings = processedFilters.ratings.map(r => Number(r)).filter(r => !isNaN(r));
              if (processedFilters.ratings.length === 0) delete processedFilters.ratings;
          } else { delete processedFilters.ratings; }
          if (processedFilters.facilities && Array.isArray(processedFilters.facilities)) {
              processedFilters.facilities = processedFilters.facilities.map(f => String(f).trim()).filter(f => f);
              if (processedFilters.facilities.length === 0) delete processedFilters.facilities;
          } else { delete processedFilters.facilities; }
          // Remove finalRate if it accidentally came through here
          delete processedFilters.finalRate; 
          
          // Remove null/empty properties
          Object.keys(processedFilters).forEach(key => {
              if (processedFilters[key] === null || (Array.isArray(processedFilters[key]) && processedFilters[key].length === 0)) {
                  delete processedFilters[key];
              }
          });
          if (Object.keys(processedFilters).length === 0) {
              processedFilters = null;
          }
      }

      // --- Process SortBy (similar to hotelChangeController) ---
      let processedSortBy = null;
      if (searchParams.sortBy && typeof searchParams.sortBy === 'object') {
          processedSortBy = {}; 
          if (typeof searchParams.sortBy.label === 'string') {
              processedSortBy.label = searchParams.sortBy.label;
          }
          if (searchParams.sortBy.hasOwnProperty('finalRate') && typeof searchParams.sortBy.finalRate === 'number' && !isNaN(searchParams.sortBy.finalRate)) {
              processedSortBy.finalRate = searchParams.sortBy.finalRate;
          }
          // Add specific sort keys if they exist (passed from frontend)
          if (searchParams.sortBy.finalRate === 'asc' || searchParams.sortBy.finalRate === 'desc') processedSortBy.finalRate = searchParams.sortBy.finalRate;
          if (searchParams.sortBy.rating === 'desc') processedSortBy.rating = 'desc';
          if (searchParams.sortBy.name === 'asc') processedSortBy.name = 'asc';

          if (Object.keys(processedSortBy).length === 0) {
              processedSortBy = null; // Let service handle default if empty
          }
      }

      // --- Prepare Params for Service --- 
      const serviceParams = {
          ...searchParams, // Include original params like checkIn, checkOut, locationId, page, occupancies etc.
          filterBy: processedFilters, // Use processed filters
          sortBy: processedSortBy     // Use processed sort
      };
      // Remove the original filterBy and sortBy from the root if they existed
      delete serviceParams.filterBy; 
      delete serviceParams.sortBy; 
      // Add the processed ones back if they are not null
      if(processedFilters) serviceParams.filterBy = processedFilters;
      if(processedSortBy) serviceParams.sortBy = processedSortBy;

      // Search hotels using HotelSearchService with processed params
      const searchResponse = await HotelSearchService.searchHotels(
          serviceParams,
          authToken,
          inquiryToken
      );

      logger.info(`Retrieved hotel search results for location: ${serviceParams.locationId}`);

      // Extract data from the service response
      const resultData = searchResponse?.results?.[0];
      const hotels = resultData?.data || [];
      const total = resultData?.totalCount || 0;
      const currentPg = resultData?.currentPage || searchParams.page || 1;
      const totalPgs = resultData?.totalPages || Math.ceil(total / (searchParams.limit || 20)); // Calculate if missing
      const trace = searchResponse?.traceId || resultData?.traceId;
      const filtered = resultData?.filteredCount !== undefined ? resultData.filteredCount : total;

      // --- Consistent Response Structure --- 
      res.json({
          success: true,
          data: {
              results: [{
                  data: hotels,
                  totalCount: total,
                  filteredCount: filtered, // Include filtered count
                  totalPages: totalPgs,
                  currentPage: currentPg,
                  nextPage: currentPg < totalPgs ? currentPg + 1 : null, // Calculate nextPage
                  traceId: trace // Include traceId within results if available
              }],
              traceId: trace // Also include traceId at the top level if available
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
  },

  cancelHotelBooking: async (req, res) => {
    try {
      const { bookingCode } = req.params;
      const { traceId } = req.body;
      const inquiryToken = req.headers['x-inquiry-token'] || 'unknown';

      if (!bookingCode) {
        return res.status(400).json({
          success: false,
          message: 'Booking code is required in the URL path.'
        });
      }
      if (!traceId) {
        return res.status(400).json({
          success: false,
          message: 'traceId is required in the request body.'
        });
      }

      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Call the cancellation service, passing traceId
      const response = await hotelCancelService.cancelBooking(
        bookingCode,
        traceId,
        authToken,
        inquiryToken
      );

      logger.info(`Cancellation request processed for booking code: ${bookingCode}`);

      // TODO: Add logic here to update the booking status in the CRM database
      // E.g., find the HotelBooking by bookingRefId (bookingCode) and set status to 'Cancelled'
      // const { HotelBooking } = require('../models/Index'); // Get model
      // await HotelBooking.findOneAndUpdate({ bookingRefId: bookingCode }, { status: 'Cancelled' });

      res.json(response); // Forward the response from the service

    } catch (error) {
      // The service layer (handleAxiosError) should format the error
      logger.error('Error in cancelHotelBooking controller:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to process cancellation request.',
        error: error.details || error.response?.data || {}
      });
    }
  }
}; 