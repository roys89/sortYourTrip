const HotelTokenManager = require("../../../shared/services/tokenManagersTC/hotelTokenManager");
const HotelAuthService = require("../../../shared/services/hotelServicesTC/hotelAuthService");
const HotelLocationService = require("../../../shared/services/hotelServicesTC/hotelLocationService");
const HotelSearchService = require("../../../shared/services/hotelServicesTC/hotelSearchService");
const HotelItineraryService = require("../../../shared/services/hotelServicesTC/hotelItineraryService");
const HotelRoomRatesService = require("../../../shared/services/hotelServicesTC/hotelRoomRatesService");
const ItineraryInquiry = require("../../models/ItineraryInquiry");
const Itinerary = require("../../models/Itinerary");
const logger = require('../../utils/logger');

// Helper function to safely extract amenities from various data formats
const extractAmenities = (hotel) => {
  const facilities = hotel.facilities;
  
  if (typeof facilities === 'string') {
    // If it's a string, split by semicolon
    return facilities.split(';').map(a => a.trim()).filter(Boolean);
  } else if (Array.isArray(facilities)) {
    // If it's already an array, use it directly
    return facilities.map(f => 
      typeof f === 'string' ? f.trim() : 
      (f && f.name ? f.name.trim() : String(f))
    ).filter(Boolean);
  } else if (facilities && typeof facilities === 'object') {
    // If it's an object with amenities/facilities data
    if (facilities.amenities && Array.isArray(facilities.amenities)) {
      return facilities.amenities.map(a => 
        typeof a === 'string' ? a.trim() : 
        (a && a.name ? a.name.trim() : String(a))
      ).filter(Boolean);
    }
  }
  
  // Default to empty array if no valid facilities found
  return [];
};

module.exports = {
  searchAvailableHotels: async (req, res) => {
    // --- Get required params from URL --- 
    const { inquiryToken, cityName, checkIn, checkOut } = req.params;
    
    // --- Get optional params/body --- 
    const { 
        occupancies: bodyOccupancies, // Occupancies passed directly in the body
        hotelId, 
        page: queryPage, 
        limit: queryLimit 
    } = req.body; // Get optional params from the POST body

    const page = parseInt(queryPage) || 1;
    const limit = parseInt(queryLimit) || 100;

    try {
      let occupancies;
      let inquiry = null; // Initialize inquiry as null

      // --- Determine Occupancies --- 
      if (bodyOccupancies && Array.isArray(bodyOccupancies) && bodyOccupancies.length > 0) {
          // Validate and use occupancies from request body
          logger.info(`Using occupancies provided in request body for inquiry: ${inquiryToken}`);
          occupancies = bodyOccupancies.map(occ => ({
              numOfAdults: parseInt(occ.numOfAdults) || 1, // Ensure valid numbers
              childAges: Array.isArray(occ.childAges) ? occ.childAges.map(age => parseInt(age)).filter(age => !isNaN(age) && age >= 0 && age <= 17) : []
          }));
          // Basic validation: Ensure at least one adult per room
          if (occupancies.some(occ => occ.numOfAdults < 1)) {
             throw new Error("Invalid occupancy data: Each room must have at least one adult.");
          }
      } else {
          // Fetch inquiry details ONLY if occupancies are not provided
          logger.info(`No valid occupancies in request body. Fetching inquiry ${inquiryToken} to derive occupancies.`);
          inquiry = await ItineraryInquiry.findOne({
              itineraryInquiryToken: inquiryToken,
          });
          if (!inquiry) {
              return res.status(404).json({ message: "Inquiry not found" });
          }
          // Derive occupancies from the fetched inquiry
          occupancies = inquiry.travelersDetails.rooms.map((room) => ({
              numOfAdults: room.adults.length,
              childAges: room.children
                  .map((age) => parseInt(age))
                  .filter((age) => !isNaN(age) && age >= 0 && age <= 17), // Added age range validation
          }));
           logger.info(`Derived occupancies from inquiry ${inquiryToken}: ${JSON.stringify(occupancies)}`);
      }

      // --- Get Auth Token --- (no change needed)
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // --- Prepare Search Params --- 
      let searchParams;
      let locationId = null;

      if (hotelId) {
          // If hotelId is provided (e.g., in body)
          logger.info(`Constructing search params using hotelId: ${hotelId} for inquiry: ${inquiryToken}`);
          searchParams = {
              hotelId, // Use hotelId from body
              checkIn,
              checkOut,
              occupancies, // Use determined occupancies
              cityName,
          };
      } else {
          // Original logic: Search by location if no hotelId
          logger.info(`Constructing search params using location for city: ${cityName}, inquiry: ${inquiryToken}`);
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
              logger.error(`City not found in location results for: ${cityName}, Inquiry: ${inquiryToken}`);
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
              limit,
              // TODO: Consider passing filterBy options from req.body as well
              // filterBy: req.body.filterBy || {} 
          };
      }

      // --- Search Hotels --- (call remains the same)
      const hotelsResponse = await HotelSearchService.searchHotels(
        searchParams,
        authToken,
        inquiryToken
      );

      // --- Process results --- (no change needed)
      logger.info(`Retrieved hotel search results for inquiry: ${inquiryToken}. Search method: ${hotelId ? 'hotelId' : 'locationId'}. Page: ${page}`);
      const allHotels = hotelsResponse.results[0].data || [];
      const totalHotels = hotelsResponse.results[0].totalCount || allHotels.length;
      const traceId = hotelsResponse.results[0].traceId;
      const allPrices = allHotels
        .map(h => h.rates?.[0]?.price || 0)
        .filter(price => price > 0);
      const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
      const maxPrice = allPrices.length ? Math.max(...allPrices) : 10000;
      const allAmenities = [...new Set(
        allHotels.flatMap(hotel => extractAmenities(hotel))
      )].slice(0, 10); 
      const allPropertyTypes = [...new Set(
        allHotels
          .map(h => h.accommodationType || 'Hotel')
          .filter(Boolean)
      )];

      res.json({
        success: true,
        data: {
          hotels: allHotels,
          traceId: traceId, 
          pagination: {
            page,
            limit,
            total: totalHotels,
            hasMore: page * limit < totalHotels,
          },
          dates: {
            checkIn,
            checkOut,
          },
          priceRange: {
            min: minPrice,
            max: maxPrice
          },
          availableFilters: {
            amenities: allAmenities,
            propertyTypes: allPropertyTypes
          }
        },
      });
    } catch (error) {
      logger.error(`Error searching hotels for inquiry ${inquiryToken}:`, error);
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
      console.error("Error fetching hotel details:", error);
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
      console.error("Error selecting hotel room:", error);
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
      console.error("Error fetching hotel rooms:", error);
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
      console.error("Error fetching hotel itinerary details:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch hotel itinerary details",
        details: error.details || {}
      });
    }
  }
};