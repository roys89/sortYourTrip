const HotelTokenManager = require("../../../shared/services/tokenManagersTC/hotelTokenManager");
const HotelAuthService = require("../../../shared/services/hotelServicesTC/hotelAuthService");
const HotelLocationService = require("../../../shared/services/hotelServicesTC/hotelLocationService");
const HotelSearchService = require("../../../shared/services/hotelServicesTC/hotelSearchService");
const HotelItineraryService = require("../../../shared/services/hotelServicesTC/hotelItineraryService");
const HotelRoomRatesService = require("../../../shared/services/hotelServicesTC/hotelRoomRatesService");
const ItineraryInquiry = require("../../models/ItineraryInquiry");


module.exports = {
  searchAvailableHotels: async (req, res) => {
    // --- Get required params from URL ---
    const { inquiryToken, cityName, checkIn, checkOut } = req.params;

    // --- Get optional params/body ---
    const {
        occupancies: bodyOccupancies, // Occupancies passed directly in the body
        hotelId,
        page: queryPage,
        traceId,  // Extract traceId from request body
        filterBy,  // Extract filter parameters from request body
        sortBy    // --- NEW: Extract sortBy object from request body --- 
    } = req.body; // Get optional params from the POST body

    const page = parseInt(queryPage) || 1;

    try {
      let occupancies;
      let inquiry = null; // Initialize inquiry as null

      // --- Determine Occupancies ---
      if (bodyOccupancies && Array.isArray(bodyOccupancies) && bodyOccupancies.length > 0) {
          // Removed logger.info
          occupancies = bodyOccupancies.map(occ => ({
              numOfAdults: parseInt(occ.numOfAdults) || 1, // Ensure valid numbers
              childAges: Array.isArray(occ.childAges) ? occ.childAges.map(age => parseInt(age)).filter(age => !isNaN(age) && age >= 0 && age <= 17) : []
          }));
          // Basic validation: Ensure at least one adult per room
          if (occupancies.some(occ => occ.numOfAdults < 1)) {
             throw new Error("Invalid occupancy data: Each room must have at least one adult.");
          }
      } else {
          // Removed logger.info
          inquiry = await ItineraryInquiry.findOne({
              itineraryInquiryToken: inquiryToken,
          });
          if (!inquiry) {
              // Keep error response, but remove logger
              return res.status(404).json({ message: "Inquiry not found" });
          }
          // Derive occupancies from the fetched inquiry
          occupancies = inquiry.travelersDetails.rooms.map((room) => ({
              numOfAdults: room.adults.length,
              childAges: room.children
                  .map((age) => parseInt(age))
                  .filter((age) => !isNaN(age) && age >= 0 && age <= 17), // Added age range validation
          }));
           // Removed logger.info
      }

      // --- Get Auth Token --- (no change needed)
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // --- Process Filters ---
      let processedFilters = null;
      if (filterBy) {
          // Create a clean copy of filters, ensuring proper types and handling nulls
          processedFilters = {
              // Boolean filters
              freeBreakfast: filterBy.freeBreakfast === true,
              isRefundable: filterBy.isRefundable === true,
              
              // String filters (null if not provided or empty)
              hotelName: filterBy.hotelName && filterBy.hotelName.trim() !== '' ? filterBy.hotelName.trim() : null,
              // --- NEW: Add type processing --- 
              type: filterBy.type && typeof filterBy.type === 'string' && filterBy.type.trim() !== '' ? filterBy.type.trim() : null,
              
              // Array filters (null if not provided or empty)
              ratings: Array.isArray(filterBy.ratings) && filterBy.ratings.length > 0 ? 
                  filterBy.ratings.map(r => parseInt(r)).filter(r => !isNaN(r)) : null,
              facilities: Array.isArray(filterBy.facilities) && filterBy.facilities.length > 0 ? 
                  filterBy.facilities.map(f => String(f)) : null,
              // --- NEW: Add tags processing --- 
              tags: Array.isArray(filterBy.tags) && filterBy.tags.length > 0 ? 
                  filterBy.tags.map(t => String(t).trim()).filter(t => t) : null,
              reviewRatings: Array.isArray(filterBy.reviewRatings) && filterBy.reviewRatings.length > 0 ? 
                  filterBy.reviewRatings.map(r => parseInt(r)).filter(r => !isNaN(r)) : null,
              subLocationIds: Array.isArray(filterBy.subLocationIds) && filterBy.subLocationIds.length > 0 ? 
                  filterBy.subLocationIds.map(id => parseInt(id)).filter(id => !isNaN(id)) : null
          };
          
          // Remove null properties to keep the request clean
          Object.keys(processedFilters).forEach(key => {
              if (processedFilters[key] === null) {
                  delete processedFilters[key];
              }
          });
          
          // If all filters were null, set processedFilters to null
          if (Object.keys(processedFilters).length === 0) {
              processedFilters = null;
          }
      }
      
      // --- NEW: Process sortBy object --- 
      let processedSortBy = null;
      if (sortBy && typeof sortBy === 'object') {
          // SIMPLIFIED: Only keep the label and possibly finalRate as a number value
          processedSortBy = {}; 
          
          // Keep the label if present
          if (typeof sortBy.label === 'string') {
              processedSortBy.label = sortBy.label;
          }
          
          // Keep finalRate ONLY if it's a valid number (for max price filter)
          if (sortBy.hasOwnProperty('finalRate') && 
              typeof sortBy.finalRate === 'number' && 
              !isNaN(sortBy.finalRate)) {
              processedSortBy.finalRate = sortBy.finalRate;
          }
          
          // If we have nothing, set to null and let service use default
          if (Object.keys(processedSortBy).length === 0) {
              processedSortBy = null;
          }
      }
      // --- END: Process sortBy object ---

      // --- Prepare Search Params ---
      let searchParams;
      let locationId = null;

      if (hotelId) {
          console.log("Searching by hotelId:", hotelId);
          searchParams = {
              // Use hotelId directly as hotelId, not in hotelIds array - this is a key fix
              hotelId: hotelId, 
              checkIn,
              checkOut,
              occupancies, // Use determined occupancies
              cityName,
              traceId, // Add traceId to search params
              filterBy: processedFilters, // Add processed filters
              sortBy: processedSortBy    // --- NEW: Add processed sortBy --- 
          };
      } else {
          // Removed logger.info
          const locationResponse = await HotelLocationService.searchLocation(
              cityName,
              authToken,
              inquiryToken,
              checkIn
          );

          const cityLocation = locationResponse.results?.find(
              (location) =>
                  location.type === "City" &&
                  location.name.toLowerCase() === cityName.toLowerCase()
          );

          if (!cityLocation) {
              // Removed logger.error
              throw new Error("City not found in location results");
          }
          locationId = cityLocation.id;

          searchParams = {
              locationId: locationId, // Use locationId obtained from city search
              checkIn,
              checkOut,
              occupancies, // Use determined occupancies
              cityName,
              page,
              traceId, // Add traceId to search params
              filterBy: processedFilters, // Add processed filters
              sortBy: processedSortBy    // --- NEW: Add processed sortBy --- 
          };
      }

      // --- Search Hotels --- (call remains the same)
      const hotelsResponse = await HotelSearchService.searchHotels(
        searchParams,
        authToken,
        inquiryToken
      );

      // --- Return RAW response ---
      // Removed logger.info
      // Removed all processing logic (calculating min/max price, amenities etc.)

      // Directly return the response from the service
      res.json({
        success: true,
        data: hotelsResponse // Send the raw response object
      });
    } catch (error) {
      // Removed logger.error
      console.error("Hotel search error:", error); // Add console.error for debugging
      // Keep sending error response
      res.status(500).json({
        success: false,
        message: error.message || "Failed to search hotels",
      });
    }
  },

  // Other functions remain the same
  getHotelDetails: async (req, res) => {
    const { inquiryToken, hotelId } = req.params;
    const { traceId, cityName, checkIn } = req.query;

    try {
      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Prepare params object to match the method signature
      const itineraryParams = {
        traceId: traceId,
        hotelId: hotelId,
        cityName: cityName,
        startDate: checkIn,
      };

      // Fetch hotel details using HotelItineraryService
      const hotelDetails =
        await HotelItineraryService.createItinerarySequential(
          itineraryParams, // Full params object
          authToken, // accessToken
          inquiryToken // inquiryToken
        );

      res.json({
        success: true,
        data: hotelDetails,
      });
    } catch (error) {
      // Removed console.error
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch hotel details",
        details: error.details || {},
      });
    }
  },

  selectHotelRoom: async (req, res) => {
    const { inquiryToken, hotelId } = req.params;
    const {
      roomsAndRateAllocations,
      recommendationId,
      items,
      itineraryCode,
      traceId,
      cityName,
      date,
    } = req.body;

    try {
      // Get auth token
      // 1. Get authentication token internally
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Select room rates
      const roomRatesResponse = await HotelRoomRatesService.selectRoomRates(
        {
          roomsAndRateAllocations,
          recommendationId,
          items,
          itineraryCode,
          traceId,
          inquiryToken,
          cityName,
          date,
        },
        authToken
      );

      // Get updated itinerary details
      const itineraryDetails = await HotelItineraryService.getItineraryDetails(
        itineraryCode,
        traceId,
        authToken,
        inquiryToken,
        cityName,
        date
      );

      // Format response
      const result = itineraryDetails?.results?.[0];
      const staticContent = result?.staticContent?.[0];

      res.json({
        success: true,
        data: {
          ...result,
          staticContent: [
            {
              id: staticContent?.id,
              contact: staticContent?.contact,
              descriptions: staticContent?.descriptions,
              images: staticContent?.images,
              facilities: staticContent?.facilities,
            },
          ],
          bookingStatus: "pending",
          hotelDetails: {
            name: staticContent?.name,
            starRating: staticContent?.starRating,
            reviews: staticContent?.reviews,
            geolocation: staticContent?.geoCode,
            address: staticContent?.contact?.address,
          },
        },
      });
    } catch (error) {
      // Removed console.error
      res.status(500).json({
        success: false,
        message: error.message || "Failed to select hotel room",
        details: error.details || {},
      });
    }
  },

  getHotelRooms: async (req, res) => {
    const { inquiryToken, hotelId } = req.params;
    const { traceId, cityName, checkIn } = req.query;

    try {
      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Prepare params for itinerary creation
      const itineraryParams = {
        hotelId: hotelId,
        traceId: traceId,
        cityName: cityName,
        startDate: checkIn,
      };

      // Get room details using HotelItineraryService
      const hotelDetails = await HotelItineraryService.createItinerarySequential(
        itineraryParams,
        authToken,
        inquiryToken
      );

      res.json({
        success: true,
        data: hotelDetails,
      });
    } catch (error) {
      // Removed console.error
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch hotel rooms",
        details: error.details || {},
      });
    }
  },

  getItineraryDetails: async (req, res) => {
    const { itineraryToken } = req.params;
    const { 
      itineraryCode,
      traceId,
      hotelId,
      cityName,
      date,
      inquiryToken 
    } = req.body;

    try {
      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(
        async () => {
          const authResponse = await HotelAuthService.getAuthToken();
          return authResponse.token;
        }
      );

      // Get itinerary details using HotelItineraryService
      const itineraryDetails = await HotelItineraryService.getItineraryDetails(
        itineraryCode,
        traceId,
        authToken,
        inquiryToken,
        cityName,
        date
      );

      // Format and validate the response
      const result = itineraryDetails?.results?.[0];
      if (!result) {
        throw new Error('No itinerary details found');
      }

      // Extract remaining time from trace ID details if available
      const traceIdDetails = result.traceIdDetails || [];
      const remainingTime = traceIdDetails.length > 0 ? traceIdDetails[0].remainingTime : null;

      res.json({
        success: true,
        results: [{
          ...result
        }]
      });

    } catch (error) {
      // Removed console.error
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch hotel itinerary details",
        details: error.details || {}
      });
    }
  }
};